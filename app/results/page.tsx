"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { BigFiveRadar } from "@/components/results/BigFiveRadar";
import { GaugeCard } from "@/components/results/GaugeCard";
import { MBTIAxes, type MBTIAxisItem } from "@/components/results/MBTIAxes";
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
  { href: "/dashboard", label: "Dashboard" },
  { href: "/results", label: "Mes resultats", active: true },
  { href: "/buddies", label: "Annuaire Buddy" },
  { href: "/messages", label: "Messagerie" },
  { href: "/resources", label: "Ressources" },
];

const MBTI_EXPLANATIONS: Record<string, string> = {
  ENFJ: "Tu federes naturellement et aides les autres a avancer avec confiance.",
  INFJ: "Tu combines intuition et profondeur pour donner du sens a tes choix.",
  ENFP: "Tu insuffles energie et creativite, surtout dans les contextes collectifs.",
  INFP: "Tu avances avec authenticite, sensibilite et recherche d'alignement personnel.",
  ENTJ: "Tu structures efficacement, prends des decisions nettes et motives ton entourage.",
  INTJ: "Tu relies vision long terme et rigueur pour faire progresser tes projets.",
};

const BIG_FIVE_LABELS: Array<{ key: keyof BigFiveScores; label: string; help: string }> = [
  { key: "agreeableness", label: "Agreabilite", help: "Qualite relationnelle et empathie" },
  { key: "extraversion", label: "Extraversion", help: "Energie sociale et expression" },
  { key: "openness", label: "Ouverture", help: "Curiosite et nouvelles idees" },
  { key: "conscientiousness", label: "Consciencieusite", help: "Organisation et constance" },
  { key: "neuroticism", label: "Stabilite emotionnelle", help: "Gestion de la pression" },
];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mbtiAxesFromScores(code: string, scores: BigFiveScores): MBTIAxisItem[] {
  const letters = code.padEnd(4, "X").slice(0, 4).split("");
  const axes: MBTIAxisItem[] = [
    {
      leftLabel: "E - Extraversion",
      rightLabel: "Introversion - I",
      activeSide: letters[0] === "E" ? "left" : "right",
      value: letters[0] === "E" ? scores.extraversion : 100 - scores.extraversion,
    },
    {
      leftLabel: "Sensation - S",
      rightLabel: "Intuition - N",
      activeSide: letters[1] === "S" ? "left" : "right",
      value: letters[1] === "S" ? 100 - scores.openness : scores.openness,
    },
    {
      leftLabel: "Logique - T",
      rightLabel: "Affect - F",
      activeSide: letters[2] === "T" ? "left" : "right",
      value: letters[2] === "T" ? 100 - scores.agreeableness : scores.agreeableness,
    },
    {
      leftLabel: "J - Structure",
      rightLabel: "Flexibilite - P",
      activeSide: letters[3] === "J" ? "left" : "right",
      value: letters[3] === "J" ? scores.conscientiousness : 100 - scores.conscientiousness,
    },
  ];

  return axes.map((axis) => ({ ...axis, value: clamp(axis.value) }));
}

function statusForStress(value: number) {
  if (value < 35) return { label: "Faible", tone: "low" as const, description: "Tu sembles globalement bien gerer la pression actuelle." };
  if (value < 70) return { label: "Modere", tone: "moderate" as const, description: "Ton niveau de tension reste gerable, avec des pics ponctuels possibles." };
  return { label: "Eleve", tone: "high" as const, description: "Une phase intense est probable: avance par petites etapes et active tes soutiens." };
}

function statusForBalance(value: number) {
  if (value < 40) return { label: "Spontane", tone: "moderate" as const, description: "Tu privilegies la flexibilite, utile pour t'adapter vite aux changements." };
  if (value < 75) return { label: "Equilibre", tone: "balanced" as const, description: "Ton organisation melange structure et souplesse de maniere saine." };
  return { label: "Organise", tone: "balanced" as const, description: "Tu fonctionnes bien avec un cadre clair et des routines stabilisantes." };
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
          result: {
            ...data,
            stress_score: clamp(data.stress_score),
            balance_score: clamp(data.balance_score),
          },
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger tes resultats pour le moment.",
        });
      }
    };

    void run();
  }, [router]);

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <section className="results-state-card" role="status" aria-live="polite">
          <h2>Chargement de tes resultats...</h2>
          <p>On recupere ton dernier profil enregistre.</p>
        </section>
      );
    }

    if (state.status === "error") {
      return (
        <section className="results-state-card results-state-error" role="alert">
          <h2>Impossible d&apos;afficher tes resultats</h2>
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
          <h2>Aucun resultat enregistre</h2>
          <p>Tu n&apos;as pas encore de resultat sauvegarde. Lance le test pour generer ton profil Emotion Lab.</p>
          <div className="results-actions">
            <Link className="btn btn-primary" href="/test/intro">
              Demarrer le test
            </Link>
            <Link className="btn btn-tertiary" href="/dashboard">
              Retour au dashboard
            </Link>
          </div>
        </section>
      );
    }

    const { result } = state;
    const axes = mbtiAxesFromScores(result.mbti_code, result.big_five_scores);
    const stress = statusForStress(result.stress_score);
    const balance = statusForBalance(result.balance_score);
    const mbtiExplanation =
      MBTI_EXPLANATIONS[result.mbti_code] ??
      "Ton profil montre un bon potentiel d'equilibre emotionnel et de progression relationnelle.";

    return (
      <div className="results-stack">
        <ResultsHero
          mbtiCode={result.mbti_code}
          mbtiName={result.mbti_name}
          explanation={mbtiExplanation}
          eyebrow="Resultat le plus recent"
          ctaLabel="Profil partageable"
        />

        <section className="results-section">
          <div className="results-section-title">Vue d&apos;ensemble Big Five</div>
          <p className="results-section-description">Ces indicateurs de 0 a 100 montrent tes tendances dominantes sur les 5 dimensions de personnalite.</p>
          <div className="overview-grid">
            {BIG_FIVE_LABELS.map((item) => (
              <article className="overview-card" key={item.key}>
                <h3>{item.label}</h3>
                <p className="overview-score">{result.big_five_scores[item.key]}<span>/100</span></p>
                <p className="overview-help">{item.help}</p>
              </article>
            ))}
          </div>
        </section>

        <MBTIAxes
          axes={axes}
          title="Axes MBTI"
          description="Tu vois ici comment tes preferences se repartissent sur chaque paire MBTI."
        />

        <BigFiveRadar
          scores={result.big_five_scores}
          title="Lecture detaillee Big Five"
          description="Le radar visualise ton profil global et les forces qui ressortent le plus actuellement."
        />

        <section className="results-section">
          <div className="results-section-title">Stress et equilibre</div>
          <p className="results-section-description">Deux jauges pour suivre ta charge mentale et ton style d&apos;organisation sur la duree.</p>
          <div className="gauges-grid">
            <GaugeCard
              label="Niveau de stress"
              value={result.stress_score}
              status={stress.label}
              description={stress.description}
              tone={stress.tone}
              scale={["Faible", "Modere", "Eleve"]}
            />
            <GaugeCard
              label="Score d'equilibre"
              value={result.balance_score}
              status={balance.label}
              description={balance.description}
              tone={balance.tone}
              scale={["Spontane", "Equilibre", "Organise"]}
            />
          </div>
        </section>

        <div className="results-actions">
          <Link className="btn btn-primary" href="/test/intro">
            Repasser le test
          </Link>
          <Link className="btn btn-tertiary" href="/buddies">
            Voir mes buddies
          </Link>
          <Link className="btn btn-tertiary" href="/dashboard">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }, [state]);

  return (
    <AppLayout title="Mes resultats" nav={RESULTS_NAV}>
      {content}
      <style jsx>{`
        .results-stack {
          display: grid;
          gap: 16px;
        }

        .results-state-card,
        .results-section {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
        }

        .results-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }

        .results-state-card h2,
        .results-section-title {
          margin: 0 0 8px;
        }

        .results-state-card p,
        :global(.results-section-description) {
          margin: 0 0 14px;
          color: var(--texte-gris);
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .overview-card {
          border: 1px solid var(--bordure);
          border-radius: 14px;
          padding: 12px;
          background: #fbf9fd;
        }

        .overview-card h3 {
          margin: 0 0 8px;
          font-size: 14px;
        }

        .overview-score {
          margin: 0;
          font-family: "Poppins", sans-serif;
          font-size: 30px;
          font-weight: 700;
          color: var(--plum);
          line-height: 1;
        }

        .overview-score span {
          font-size: 14px;
          color: var(--texte-clair);
          margin-left: 4px;
        }

        .overview-help {
          margin: 8px 0 0;
          font-size: 12px;
          color: var(--texte-gris);
        }

        :global(.results-hero) {
          background: linear-gradient(132deg, #7e3d5e, #8a6889 52%, #62809a);
          color: #fff;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(48, 36, 55, 0.16);
        }

        :global(.eyebrow) {
          display: inline-flex;
          font-size: 12px;
          letter-spacing: 0.04em;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
        }

        :global(.results-code) {
          margin-top: 12px;
          font-family: "Poppins", sans-serif;
          font-weight: 800;
          font-size: clamp(42px, 6vw, 58px);
          line-height: 1;
        }

        :global(.results-name) {
          margin-top: 8px;
          font-family: "Poppins", sans-serif;
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 700;
        }

        :global(.results-tagline) {
          margin: 10px 0 0;
          max-width: 680px;
          color: rgba(255, 255, 255, 0.92);
        }

        :global(.results-share) {
          margin-top: 14px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 600;
        }

        :global(.axes-grid),
        :global(.gauges-grid) {
          display: grid;
          gap: 12px;
        }

        :global(.axe-row) {
          display: grid;
          gap: 8px;
        }

        :global(.axe-header) {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          color: var(--texte-clair);
        }

        :global(.axe-letter.active) {
          color: var(--plum);
          font-weight: 700;
        }

        :global(.axe-track) {
          height: 12px;
          border-radius: 999px;
          background: #ece7f1;
          overflow: hidden;
        }

        :global(.axe-fill) {
          height: 100%;
          background: linear-gradient(90deg, #7e3d5e, #2e8bbf);
          border-radius: 999px;
          position: relative;
        }

        :global(.axe-dot) {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #fff;
          background: #7e3d5e;
          position: absolute;
          right: -7px;
          top: -1px;
        }

        :global(.big-five-grid) {
          display: grid;
          gap: 14px;
        }

        :global(.radar-card) {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 10px;
          background: #f9f6fb;
        }

        :global(.radar-svg) {
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
          display: block;
        }

        :global(.radar-grid-line) {
          fill: none;
          stroke: #d7cedd;
          stroke-width: 1.4;
        }

        :global(.radar-polygon) {
          fill: rgba(126, 61, 94, 0.2);
          stroke: #7e3d5e;
          stroke-width: 2;
        }

        :global(.radar-label) {
          font-size: 12px;
          fill: var(--texte-gris);
        }

        :global(.forces-card) {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 14px;
          background: #fff;
          display: grid;
          gap: 10px;
        }

        :global(.forces-card h3) {
          margin: 0;
          font-size: 16px;
        }

        :global(.force-item) {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 10px;
          align-items: start;
        }

        :global(.force-icon) {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #f4eaf1;
          color: var(--plum);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        :global(.force-content h4) {
          margin: 0 0 2px;
          font-size: 14px;
        }

        :global(.force-content p) {
          margin: 0;
          font-size: 13px;
          color: var(--texte-gris);
        }

        :global(.gauge-card) {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 14px;
        }

        :global(.gauge-label) {
          color: var(--texte-clair);
          font-size: 13px;
        }

        :global(.gauge-value) {
          margin-top: 4px;
          font-family: "Poppins", sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: var(--plum);
        }

        :global(.gauge-value span) {
          font-size: 17px;
          color: var(--texte-clair);
        }

        :global(.gauge-status) {
          font-size: 13px;
          font-weight: 700;
        }

        :global(.gauge-status.faible),
        :global(.gauge-value-faible) {
          color: #0e9f6e;
        }

        :global(.gauge-status.modere),
        :global(.gauge-value-modere) {
          color: #d97706;
        }

        :global(.gauge-status.eleve),
        :global(.gauge-value-eleve) {
          color: #dc2626;
        }

        :global(.gauge-status.equilibre),
        :global(.gauge-value-equilibre) {
          color: #0284c7;
        }

        :global(.gauge-track) {
          margin-top: 8px;
          height: 10px;
          border-radius: 999px;
          background: #ece7f1;
          overflow: hidden;
        }

        :global(.gauge-fill) {
          height: 100%;
        }

        :global(.gauge-fill.faible) {
          background: #0e9f6e;
        }

        :global(.gauge-fill.modere) {
          background: #d97706;
        }

        :global(.gauge-fill.eleve) {
          background: #dc2626;
        }

        :global(.gauge-fill.equilibre) {
          background: #0284c7;
        }

        :global(.gauge-scale) {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--texte-clair);
        }

        :global(.gauge-card p) {
          margin: 10px 0 0;
          color: var(--texte-gris);
          font-size: 13px;
        }

        .results-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 1199px) {
          .overview-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1023px) {
          .overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 899px) {
          :global(.big-five-grid),
          :global(.gauges-grid) {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 900px) {
          :global(.big-five-grid) {
            grid-template-columns: 1fr 1.1fr;
          }

          :global(.gauges-grid) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }

          .results-actions :global(.btn) {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
