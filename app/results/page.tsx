"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { GaugeCard } from "@/components/results/GaugeCard";
import { ResultsHero } from "@/components/results/ResultsHero";
import type { BigFiveScores } from "@/lib/calculate-result";
import { getSupabaseClient } from "@/lib/supabase/client";

type StoredResult = {
  mbti_code: string;
  mbti_name: string;
  big_five_scores: BigFiveScores;
  stress_score: number;
  balance_score: number;
  created_at: string;
};

type ResultsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; result: StoredResult };

const RESULTS_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" as const },
  { href: "/results", label: "Mes résultats", active: true, icon: "chart" as const },
  { href: "/buddies", label: "Annuaire Buddy", icon: "users" as const },
  { href: "/requests", label: "Mes demandes", badge: 2, icon: "mail" as const },
  { href: "/messages", label: "Messagerie", badge: 3, icon: "message" as const },
  { href: "/chatbot", label: "Chatbot", icon: "bot" as const },
  { href: "/resources", label: "Ressources", icon: "book" as const },
];

const BIG_FIVE_CARDS: Array<{ key: keyof BigFiveScores; label: string }> = [
  { key: "agreeableness", label: "Agréabilité" },
  { key: "extraversion", label: "Extraversion" },
  { key: "openness", label: "Ouverture" },
  { key: "conscientiousness", label: "Consciencieusité" },
];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date indisponible";
  const formatted = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
  return `Passé le ${formatted}`;
}

function bigFiveDescription(key: keyof BigFiveScores, score: number): string {
  if (key === "agreeableness") return score >= 70 ? "Super-pouvoir relationnel. Les autres se confient à toi." : "Tu combines écoute et franchise dans tes relations.";
  if (key === "extraversion") return score >= 70 ? "Tu te nourris des interactions." : "Tu alternes bien entre temps social et temps calme.";
  if (key === "openness") return score >= 70 ? "Tu aimes les nouvelles idées." : "Tu restes pragmatique tout en gardant de la curiosité.";
  return score >= 70 ? "Tu tiens un cadre clair et fiable." : "Bon équilibre méthode / souplesse.";
}

function statusForStress(value: number) {
  if (value < 35) return { label: "Faible", chipLabel: "Faible", tone: "low" as const, description: "Tu sembles globalement bien gérer la pression actuelle." };
  if (value < 70) return { label: "Modéré", chipLabel: "Modéré — élevé", tone: "moderate" as const, description: "Ton niveau de tension reste gérable, avec des pics ponctuels possibles." };
  return { label: "Élevé", chipLabel: "Élevé", tone: "high" as const, description: "Une phase intense est probable: avance par petites étapes et active tes soutiens." };
}

function statusForBalance(value: number) {
  if (value < 40) return { label: "Spontané", chipLabel: "Spontanée", tone: "moderate" as const, description: "Tu privilégies la flexibilité, utile pour t'adapter vite aux changements." };
  if (value < 75) return { label: "Équilibré", chipLabel: "Équilibrée", tone: "balanced" as const, description: "Ton organisation mélange structure et souplesse de manière saine." };
  return { label: "Organisé", chipLabel: "Organisée", tone: "balanced" as const, description: "Tu fonctionnes bien avec un cadre clair et des routines stabilisantes." };
}

export default function ResultsPage() {
  const router = useRouter();
  const [state, setState] = useState<ResultsState>({ status: "loading" });

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

        const { data, error } = await supabase
          .from("test_results")
          .select("mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<StoredResult>();

        if (error) {
          setState({ status: "error", message: error.message });
          return;
        }

        if (!data) {
          setState({ status: "empty" });
          return;
        }

        setState({
          status: "ready",
          result: { ...data, stress_score: clamp(data.stress_score), balance_score: clamp(data.balance_score) },
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger tes résultats pour le moment.",
        });
      }
    };

    void run();
  }, [router]);

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <section className="results-state-card" role="status" aria-live="polite">
          <h2>Chargement de tes résultats...</h2>
          <p>On récupère ton dernier profil enregistré.</p>
        </section>
      );
    }

    if (state.status === "error") {
      return (
        <section className="results-state-card results-state-error" role="alert">
          <h2>Impossible d&apos;afficher tes résultats</h2>
          <p>{state.message}</p>
          <div className="results-actions">
            <Link className="btn btn-tertiary" href="/dashboard">
              Retour au dashboard
            </Link>
            <Link className="btn btn-primary" href="/test/intro">
              Repasser le test
            </Link>
          </div>
        </section>
      );
    }

    if (state.status === "empty") {
      return (
        <section className="results-state-card" role="status">
          <h2>Aucun résultat enregistré</h2>
          <p>Tu n&apos;as pas encore de résultat sauvegardé. Lance le test pour générer ton profil Emotion Lab.</p>
          <div className="results-actions">
            <Link className="btn btn-primary" href="/test/intro">
              Démarrer le test
            </Link>
            <Link className="btn btn-tertiary" href="/dashboard">
              Retour au dashboard
            </Link>
          </div>
        </section>
      );
    }

    const { result } = state;
    const stress = statusForStress(result.stress_score);
    const balance = statusForBalance(result.balance_score);

    return (
      <div className="results-stack">
        <header className="results-header">
          <h1>Mes résultats</h1>
          <div className="results-tabs" role="tablist" aria-label="Historique des résultats">
            <button className="results-tab active" type="button" role="tab" aria-selected="true">
              Actuel
            </button>
            <button className="results-tab" type="button" role="tab" aria-selected="false">
              Historique (1)
            </button>
          </div>
        </header>

        <ResultsHero mbtiCode={result.mbti_code || "ENFJ"} mbtiName={result.mbti_name || "Le Protagoniste"} dateLabel={formatDateLabel(result.created_at)} ctaLabel="PDF" compact />

        <section className="results-grid" aria-label="Scores principaux">
          {BIG_FIVE_CARDS.map((item) => {
            const score = clamp(result.big_five_scores[item.key]);
            return (
              <article className="score-card" key={item.key}>
                <h2>{item.label}</h2>
                <p className="score-value">
                  {score}
                  <span>/100</span>
                </p>
                <p className="score-description">{bigFiveDescription(item.key, score)}</p>
              </article>
            );
          })}
        </section>

        <section className="results-grid results-grid-lower" aria-label="Stress et organisation">
          <GaugeCard
            label="Ton niveau de stress"
            value={result.stress_score}
            status={stress.label}
            chipLabel={stress.chipLabel}
            description={stress.description}
            tone={stress.tone}
            scale={["Faible", "Modéré", "Élevé"]}
            compact
            hideTrack
          />
          <GaugeCard
            label="Style d'organisation"
            value={result.balance_score}
            status={balance.label}
            chipLabel={balance.chipLabel}
            description={balance.description}
            tone={balance.tone}
            scale={["Spontané", "Équilibré", "Organisé"]}
            compact
            hideTrack
          />
        </section>

        <div className="results-actions">
          <button className="btn btn-primary" type="button">
            Télécharger en PDF
          </button>
          <Link className="btn btn-outline" href="/test/intro">
            Repasser le test
          </Link>
        </div>
      </div>
    );
  }, [state]);

  return (
    <AppLayout title="Mes résultats" nav={RESULTS_NAV}>
      {content}
      <style jsx>{`
        .results-stack {
          display: grid;
          gap: 18px;
        }
        .results-header h1 {
          margin: 0;
          font-size: clamp(2rem, 4.2vw, 3.3rem);
          line-height: 1.08;
          color: #0f1d4a;
          font-weight: 800;
        }
        .results-tabs {
          margin-top: 16px;
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          border-radius: 14px;
          background: #edeaf1;
        }
        .results-tab {
          border: 0;
          background: transparent;
          color: #344165;
          border-radius: 10px;
          padding: 9px 16px;
          font-weight: 600;
          font-size: 1rem;
        }
        .results-tab.active {
          background: #ffffff;
          color: #7e3d5e;
          box-shadow: 0 1px 4px rgba(14, 21, 46, 0.08);
        }
        .results-state-card {
          background: #fff;
          border: 1px solid #dcd3e5;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 8px 18px rgba(26, 20, 40, 0.06);
        }
        .results-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }
        .results-state-card h2 {
          margin: 0 0 8px;
        }
        .results-state-card p {
          margin: 0 0 14px;
          color: #5c6482;
        }
        :global(.results-hero) {
          background: linear-gradient(132deg, #7e3d5e, #8a6889 54%, #4b95c8);
          color: #fff;
          border-radius: 22px;
          padding: 24px;
          box-shadow: 0 16px 36px rgba(48, 36, 55, 0.2);
        }
        :global(.results-hero-head) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        :global(.results-code) {
          margin: 0;
          font-size: clamp(3rem, 6vw, 4.5rem);
          line-height: 0.96;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        :global(.results-name) {
          margin-top: 6px;
          font-size: clamp(1.8rem, 3vw, 2.2rem);
          line-height: 1.1;
          font-weight: 700;
        }
        :global(.results-date) {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          font-weight: 500;
        }
        :global(.results-share) {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.18);
          color: #fff;
          padding: 10px 20px;
          min-width: 74px;
          min-height: 44px;
          font-weight: 700;
        }
        .results-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .score-card {
          background: #ffffff;
          border: 1px solid #d8d3e2;
          border-radius: 18px;
          padding: 20px 22px;
          box-shadow: 0 8px 20px rgba(22, 24, 40, 0.05);
          display: grid;
          gap: 10px;
        }
        .score-card h2 {
          margin: 0;
          color: #0f1d4a;
          font-size: clamp(1.5rem, 2.2vw, 2rem);
          line-height: 1.12;
        }
        .score-value {
          margin: 0;
          font-size: clamp(2.2rem, 4vw, 3rem);
          line-height: 1;
          color: #7e3d5e;
          font-weight: 800;
        }
        .score-value span {
          margin-left: 4px;
          font-size: 0.55em;
          color: #5f7095;
          font-weight: 700;
        }
        .score-description {
          margin: 0;
          color: #334366;
          font-size: 1.08rem;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .results-grid-lower :global(.gauge-card) {
          padding: 20px 22px;
        }
        :global(.gauge-main) {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        :global(.gauge-card .gauge-label) {
          margin: 0;
          color: #09173e;
          font-size: clamp(1.45rem, 2.3vw, 2rem);
          line-height: 1.15;
          font-weight: 700;
        }
        :global(.gauge-card .gauge-value) {
          margin-top: 0;
          font-size: clamp(2.2rem, 3.6vw, 3rem);
          font-weight: 800;
          line-height: 1;
        }
        :global(.gauge-card .gauge-value span) {
          margin-left: 4px;
          font-size: 0.55em;
          color: #5f7095;
          font-weight: 700;
        }
        :global(.gauge-chip) {
          font-size: 0.95rem;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
          line-height: 1;
        }
        :global(.gauge-chip.faible) {
          color: #12915f;
          background: #e2f4ec;
        }
        :global(.gauge-chip.modere) {
          color: #d87524;
          background: #fff1e5;
        }
        :global(.gauge-chip.eleve) {
          color: #ca5120;
          background: #ffeae3;
        }
        :global(.gauge-chip.equilibre) {
          color: #2ea36a;
          background: #e2f4ea;
        }
        :global(.gauge-card p) {
          margin: 10px 0 0;
          color: #334366;
          font-size: 1.02rem;
          line-height: 1.4;
        }
        .results-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .results-actions :global(.btn) {
          min-height: 46px;
        }
        .btn-outline {
          background: #fff;
          border: 1px solid #a44d76;
          color: #7e3d5e;
        }
        @media (max-width: 900px) {
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          :global(.results-hero-head) {
            align-items: flex-start;
            flex-direction: column;
          }
          :global(.results-share) {
            align-self: flex-end;
          }
          .results-tabs {
            width: 100%;
            justify-content: stretch;
          }
          .results-tab {
            flex: 1;
            text-align: center;
            padding: 10px 8px;
            font-size: 0.95rem;
          }
          .score-card {
            padding: 18px;
          }
          .results-actions :global(.btn) {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
