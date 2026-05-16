"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import type { BigFiveScores } from "@/lib/calculate-result";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
};

type ResultRow = {
  mbti_code: string | null;
  mbti_name: string | null;
  big_five_scores: BigFiveScores | null;
  stress_score: number | null;
  balance_score: number | null;
  created_at: string;
};

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
  | { status: "no-profile" }
  | { status: "no-result" }
  | { status: "ready"; result: StoredResult };

type CardTone = "plum" | "blue" | "orange" | "green";

type ResultCard = {
  title: string;
  value: number;
  description?: string;
  tone?: CardTone;
  pill?: {
    label: string;
    tone: "orange" | "green";
  };
};

function clamp(value: number | null | undefined): number {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function hasScores(scores: BigFiveScores | null): scores is BigFiveScores {
  return Boolean(scores) && ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"].every((key) => typeof scores?.[key as keyof BigFiveScores] === "number");
}

function formatResultDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date non disponible";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function stressStatus(value: number) {
  if (value < 35) return { label: "Faible", description: "Tu sembles globalement bien gerer la pression actuelle." };
  if (value < 70) return { label: "Modéré", description: "Tu traverses une periode intense. Garde des temps de recuperation visibles." };
  return { label: "Élevé", description: "Ton niveau de pression merite du soutien et de vrais temps de pause." };
}

function organizationStatus(value: number) {
  if (value < 40) return { label: "Spontanée", description: "Tu privilegies l'adaptation rapide. Un cadre leger peut aider." };
  if (value < 75) return { label: "Équilibrée", description: "Bon equilibre entre methode et souplesse." };
  return { label: "Organisée", description: "Tu fonctionnes bien avec des routines claires et un cadre visible." };
}

function scoreDescription(title: string, value: number): string {
  if (title === "Agréabilité") {
    if (value >= 75) return "Super-pouvoir relationnel. Les autres se confient facilement a toi.";
    if (value >= 45) return "Tu sais cooperer tout en gardant tes limites.";
    return "Tu privilegies la franchise et l'autonomie dans tes relations.";
  }
  if (title === "Extraversion") {
    if (value >= 75) return "Tu es energise par les interactions.";
    if (value >= 45) return "Tu alternes bien entre lien social et temps calme.";
    return "Tu recuperes surtout dans les moments calmes ou en petit comite.";
  }
  if (title === "Ouverture") {
    if (value >= 75) return "Tu aimes explorer les nouvelles idees.";
    if (value >= 45) return "Tu combines curiosite et pragmatisme.";
    return "Tu preferes les reperes clairs et les approches deja eprouvees.";
  }
  if (value >= 75) return "Tu avances avec structure, priorites et regularite.";
  if (value >= 45) return "Bon equilibre methode / souplesse.";
  return "Tu gagnes a poser quelques reperes simples avant d'avancer.";
}

function buildCards(result: StoredResult): ResultCard[] {
  const stress = stressStatus(result.stress_score);
  const organization = organizationStatus(result.balance_score);
  return [
    {
      title: "Agréabilité",
      value: result.big_five_scores.agreeableness,
      description: scoreDescription("Agréabilité", result.big_five_scores.agreeableness),
    },
    {
      title: "Extraversion",
      value: result.big_five_scores.extraversion,
      description: scoreDescription("Extraversion", result.big_five_scores.extraversion),
    },
    {
      title: "Ouverture",
      value: result.big_five_scores.openness,
      description: scoreDescription("Ouverture", result.big_five_scores.openness),
    },
    {
      title: "Consciencieusité",
      value: result.big_five_scores.conscientiousness,
      description: scoreDescription("Consciencieusité", result.big_five_scores.conscientiousness),
      tone: "blue",
    },
    {
      title: "Ton niveau de stress",
      value: result.stress_score,
      description: stress.description,
      tone: "orange",
      pill: { label: stress.label, tone: "orange" },
    },
    {
      title: "Style d'organisation",
      value: result.balance_score,
      description: organization.description,
      tone: "green",
      pill: { label: organization.label, tone: "green" },
    },
  ];
}

export default function ResultsPage() {
  const router = useRouter();
  const [state, setState] = useState<ResultsState>({ status: "loading" });

  useEffect(() => {
    const run = async () => {
      setState({ status: "loading" });
      try {
        const supabase = getSupabaseClient();
        const { data: authData, error: userError } = await supabase.auth.getUser();
        const user = authData.user;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const [profileRes, latestResultRes] = await Promise.all([
          supabase.from("profiles").select("id").eq("id", user.id).maybeSingle<ProfileRow>(),
          supabase
            .from("test_results")
            .select("mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle<ResultRow>(),
        ]);

        const firstError = profileRes.error ?? latestResultRes.error;
        if (firstError) {
          setState({ status: "error", message: firstError.message });
          return;
        }

        if (!profileRes.data) {
          setState({ status: "no-profile" });
          return;
        }

        const row = latestResultRes.data;
        if (!row || !row.mbti_code || !row.mbti_name || !hasScores(row.big_five_scores)) {
          setState({ status: "no-result" });
          return;
        }

        setState({
          status: "ready",
          result: {
            mbti_code: row.mbti_code,
            mbti_name: row.mbti_name,
            big_five_scores: {
              openness: clamp(row.big_five_scores.openness),
              conscientiousness: clamp(row.big_five_scores.conscientiousness),
              extraversion: clamp(row.big_five_scores.extraversion),
              agreeableness: clamp(row.big_five_scores.agreeableness),
              neuroticism: clamp(row.big_five_scores.neuroticism),
            },
            stress_score: clamp(row.stress_score),
            balance_score: clamp(row.balance_score),
            created_at: row.created_at,
          },
        });
      } catch (error) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Impossible de charger tes resultats." });
      }
    };

    void run();
  }, [router]);

  const content = useMemo(() => {
    if (state.status === "loading") return <StateCard title="Chargement de tes resultats..." text="On recupere ton profil et ton dernier test sauvegarde." />;
    if (state.status === "error") return <StateCard title="Impossible d'afficher tes resultats" text={state.message} error />;
    if (state.status === "no-profile") return <StateCard title="Profil introuvable" text="Complete ton profil pour afficher tes resultats connectes." primaryHref="/profile" primaryLabel="Completer mon profil" />;
    if (state.status === "no-result") return <StateCard title="Aucun test complete" text="Passe le test pour generer ton profil Emotion Lab." primaryHref="/test/intro" primaryLabel="Demarrer le test" />;

    const { result } = state;
    const cards = buildCards(result);
    const dateLabel = formatResultDate(result.created_at);

    return (
      <main className="results-page">
        <h1>Mes résultats</h1>

        <div className="tabs" aria-label="Vue des résultats">
          <button className="tab active" type="button" aria-pressed="true">
            Actuel
          </button>
          <button className="tab" type="button" aria-pressed="false">
            Historique (1)
          </button>
        </div>

        <section className="hero-card" aria-label="Profil MBTI actuel">
          <div className="hero-info">
            <h2>{result.mbti_code}</h2>
            <h3>{result.mbti_name}</h3>
            <p>Passé le {dateLabel}</p>
          </div>
          <button className="pdf-small" type="button">
            PDF
          </button>
        </section>

        <section className="cards-grid" aria-label="Scores principaux">
          {cards.map((card) => (
            <article className="result-card" key={card.title}>
              <h3>{card.title}</h3>
              <div className="score-row">
                <span className={`score ${card.tone ?? ""}`}>{card.value}</span>
                <span className="out-of">/100</span>
                {card.pill ? <span className={`pill ${card.pill.tone}`}>{card.pill.label}</span> : null}
              </div>
              {card.description ? <p>{card.description}</p> : null}
            </article>
          ))}
        </section>

        <div className="actions">
          <button className="btn btn-primary" type="button">
            Télécharger en PDF
          </button>
          <Link className="btn btn-outline" href="/test/intro">
            Repasser le test
          </Link>
        </div>
      </main>
    );
  }, [state]);

  return (
    <AppLayout title="Mes resultats">
      {content}
      <style jsx global>{`
        .results-page {
          --plum: #7e3d5e;
          --blue: #2e8bbf;
          --dark: #071238;
          --text: #102044;
          --muted: #52627a;
          --border: #e8dff0;
          --bg: #fffcff;
          --card: #ffffff;
          --orange: #f28a33;
          --green: #43c181;
          --shadow: 0 8px 20px rgba(18, 20, 40, 0.08);
          --gradient: linear-gradient(135deg, #8b4d73 0%, #7d7898 55%, #4aa0d0 100%);
          width: 100%;
          max-width: 1020px;
          margin: 0 auto;
          padding: 22px 16px 80px;
          background: var(--bg);
          color: var(--text);
        }
        .results-page h1 {
          margin: 0 0 22px;
          color: var(--dark);
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.1;
        }
        .tabs {
          display: inline-flex;
          gap: 6px;
          margin-bottom: 20px;
          padding: 4px;
          border-radius: 12px;
          background: #f4eff8;
        }
        .tab {
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: var(--text);
          cursor: default;
          font-size: 13px;
          font-weight: 600;
          padding: 11px 16px;
        }
        .tab.active {
          background: #ffffff;
          color: var(--plum);
          box-shadow: 0 2px 8px rgba(126, 61, 94, 0.08);
        }
        .hero-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 156px;
          margin-bottom: 24px;
          padding: 28px 24px;
          border-radius: 20px;
          color: #ffffff;
          background: var(--gradient);
        }
        .hero-info h2 {
          margin: 0 0 6px;
          color: #ffffff;
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1;
        }
        .hero-info h3 {
          margin: 0 0 12px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.2;
        }
        .hero-info p {
          margin: 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: 12px;
        }
        .pdf-small {
          width: 68px;
          height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .result-card {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-height: 158px;
          padding: 21px 22px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--card);
          box-shadow: var(--shadow);
        }
        .result-card h3 {
          margin: 0 0 18px;
          color: #050b2d;
          font-size: 19px;
          font-weight: 700;
        }
        .score-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          min-width: 0;
        }
        .score {
          color: var(--plum);
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1;
        }
        .score.blue {
          color: var(--blue);
        }
        .score.orange {
          color: var(--orange);
        }
        .score.green {
          color: var(--green);
        }
        .out-of {
          align-self: flex-end;
          margin-left: -8px;
          padding-bottom: 2px;
          color: #637593;
          font-size: 14px;
          font-weight: 800;
        }
        .result-card p {
          margin: 0;
          color: #25395e;
          font-size: 13px;
          line-height: 1.45;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          margin-left: 10px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }
        .pill.orange {
          color: var(--orange);
          background: #fff6ec;
        }
        .pill.green {
          color: var(--green);
          background: #eefff5;
        }
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border: 1px solid transparent;
          border-radius: 11px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          padding: 0 20px;
          text-decoration: none;
        }
        .btn-primary {
          background: var(--blue);
          color: #ffffff;
        }
        .btn-outline {
          border-color: var(--plum);
          background: #ffffff;
          color: var(--plum);
        }
        .state-card {
          max-width: 760px;
          margin: 0 auto;
          padding: 22px;
          border: 1px solid #e4dcea;
          border-radius: 14px;
          background: #ffffff;
          color: #26365a;
        }
        .state-card.error {
          border-color: #f0c4cb;
          background: #fff8f9;
        }
        .state-card h2 {
          margin: 0 0 8px;
        }
        .state-card p {
          margin: 0 0 16px;
          color: #59657f;
        }
        @media (max-width: 700px) {
          .results-page {
            padding: 24px 15px 60px;
          }
          .results-page h1 {
            font-size: 34px;
          }
          .hero-card {
            min-height: 150px;
            padding: 26px 24px;
          }
          .hero-info h2 {
            font-size: 46px;
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .result-card {
            min-height: 150px;
          }
          .actions {
            flex-direction: column;
          }
          .btn {
            width: 100%;
          }
        }
        @media (max-width: 430px) {
          .score-row {
            flex-wrap: wrap;
          }
          .pill {
            margin-left: 0;
          }
        }
      `}</style>
    </AppLayout>
  );
}

function StateCard({
  title,
  text,
  primaryHref = "/dashboard",
  primaryLabel = "Retour au dashboard",
  error = false,
}: {
  title: string;
  text: string;
  primaryHref?: string;
  primaryLabel?: string;
  error?: boolean;
}) {
  return (
    <section className={`state-card ${error ? "error" : ""}`} role={error ? "alert" : "status"}>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="btn btn-primary" href={primaryHref}>
        {primaryLabel}
      </Link>
    </section>
  );
}
