"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeBuddyCompatibilityScore } from "@/lib/compatibility";
import { BigFiveRadar } from "@/components/results/BigFiveRadar";
import { BuddySuggestionCard, type BuddySuggestion } from "@/components/results/BuddySuggestionCard";
import { GaugeCard } from "@/components/results/GaugeCard";
import { MBTIAxes, type MBTIAxisItem } from "@/components/results/MBTIAxes";
import { ResultsHero } from "@/components/results/ResultsHero";
import type { BigFiveScores } from "@/lib/calculate-result";
import { getSupabaseClient } from "@/lib/supabase/client";
import { clearLegacyTestFlowStorage, getUserTestFlowStorageKey } from "@/lib/test-flow-storage";

const AVAILABLE_ROUTES = new Set(["/dashboard", "/test/intro"]);

type StoredResult = {
  mbti_code: string;
  mbti_name: string;
  big_five_scores: BigFiveScores;
  stress_score: number;
  balance_score: number;
  calculated_at?: string;
};

type ResultState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; result: StoredResult; buddies: BuddySuggestion[] };

type TestResultRow = StoredResult & { created_at: string };

type ProfileRow = {
  id: string;
  pseudo: string | null;
  study_level: string | null;
  bio: string | null;
  looking_for: string | null;
  is_visible: boolean | null;
};

type HobbyRow = {
  user_id: string;
  hobby: string;
};

type BuddyResultRow = {
  user_id: string;
  mbti_code: string | null;
  created_at: string;
};

const MBTI_EXPLANATIONS: Record<string, string> = {
  ENFJ: "Tu inspires les autres par ta chaleur, ton sens du collectif et ta capacite a mobiliser.",
  INFJ: "Tu allies profondeur et intuition pour guider les autres avec tact et lucidity.",
  ENFP: "Tu apportes energie, creativite et optimisme dans les environnements en mouvement.",
  INFP: "Tu avances avec authenticite, sensibilite et recherche de sens dans tes choix.",
  ENTJ: "Tu structures vite, prends des decisions claires et sais entrainer une equipe.",
  INTJ: "Tu combines vision strategique, autonomie et rigueur pour aller au bout de tes idees.",
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readLocalResult(userId: string): StoredResult | null {
  if (typeof window === "undefined") return null;
  const storageKey = getUserTestFlowStorageKey(userId, "result");
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredResult>;
    if (!parsed?.mbti_code || !parsed?.mbti_name || !parsed.big_five_scores) return null;
    return {
      mbti_code: parsed.mbti_code,
      mbti_name: parsed.mbti_name,
      big_five_scores: parsed.big_five_scores,
      stress_score: clamp(parsed.stress_score ?? 0),
      balance_score: clamp(parsed.balance_score ?? 0),
      calculated_at: parsed.calculated_at,
    };
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
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
  if (value < 35) return { label: "Faible", tone: "low" as const };
  if (value < 70) return { label: "Modere", tone: "moderate" as const };
  return { label: "Eleve", tone: "high" as const };
}

function statusForBalance(value: number) {
  if (value < 40) return { label: "Spontane", tone: "moderate" as const };
  if (value < 75) return { label: "Equilibre", tone: "balanced" as const };
  return { label: "Organise", tone: "balanced" as const };
}

function initialsFromPseudo(pseudo: string | null | undefined): string {
  const clean = pseudo?.trim().replace(/^@+/, "") ?? "B";
  return clean.slice(0, 1).toUpperCase() || "B";
}

function buddyTagline(profile: ProfileRow): string {
  const lookingFor = profile.looking_for?.trim();
  if (lookingFor) return lookingFor;
  const bio = profile.bio?.trim();
  if (bio) return bio.slice(0, 90);
  return "Disponible pour apprendre ensemble et garder un bon rythme.";
}

function toBuddySuggestion(params: {
  meMbti: string;
  meStudyLevel: string | null;
  myHobbies: Set<string>;
  profile: ProfileRow;
  buddyMbti: string | null;
  buddyHobbies: string[];
}): BuddySuggestion {
  const shared = params.buddyHobbies.filter((hobby) => params.myHobbies.has(hobby)).slice(0, 3);
  const compatibility = computeBuddyCompatibilityScore({
    sharedHobbiesCount: shared.length,
    currentMbti: params.meMbti,
    buddyMbti: params.buddyMbti,
    sameStudyLevel: Boolean(params.meStudyLevel && params.profile.study_level && params.meStudyLevel === params.profile.study_level),
  });

  return {
    id: params.profile.id,
    handle: `@${params.profile.pseudo?.trim().replace(/^@+/, "") || "buddy"}`,
    initials: initialsFromPseudo(params.profile.pseudo),
    mbti: params.buddyMbti ?? "MBTI",
    level: params.profile.study_level?.trim() || "Niveau non renseigne",
    tagline: buddyTagline(params.profile),
    interests: shared,
    compatibility: clamp(compatibility),
  };
}

async function loadBuddySuggestions(userId: string, result: StoredResult): Promise<BuddySuggestion[]> {
  const supabase = getSupabaseClient();
  const [profilesRes, hobbiesRes, resultsRes, myProfileRes] = await Promise.all([
    supabase.from("profiles").select("id,pseudo,study_level,bio,looking_for,is_visible").neq("id", userId).eq("is_visible", true).limit(30).returns<ProfileRow[]>(),
    supabase.from("user_hobbies").select("user_id,hobby").in("user_id", [userId]),
    supabase.from("test_results").select("user_id,mbti_code,created_at").neq("user_id", userId).order("created_at", { ascending: false }).limit(300).returns<BuddyResultRow[]>(),
    supabase.from("profiles").select("study_level").eq("id", userId).maybeSingle<{ study_level: string | null }>(),
  ]);

  const firstError = profilesRes.error ?? hobbiesRes.error ?? resultsRes.error ?? myProfileRes.error;
  if (firstError) throw new Error(firstError.message);

  const visibleProfiles = profilesRes.data ?? [];
  if (visibleProfiles.length === 0) return [];

  const candidateIds = visibleProfiles.map((row) => row.id);
  const [candidateHobbiesRes] = await Promise.all([
    supabase.from("user_hobbies").select("user_id,hobby").in("user_id", candidateIds).returns<HobbyRow[]>(),
  ]);
  if (candidateHobbiesRes.error) throw new Error(candidateHobbiesRes.error.message);

  const myHobbies = new Set((hobbiesRes.data ?? []).map((row) => row.hobby));
  const hobbiesByUser = new Map<string, string[]>();
  for (const row of candidateHobbiesRes.data ?? []) {
    const list = hobbiesByUser.get(row.user_id) ?? [];
    list.push(row.hobby);
    hobbiesByUser.set(row.user_id, list);
  }

  const latestMbtiByUser = new Map<string, string | null>();
  for (const row of resultsRes.data ?? []) {
    if (!latestMbtiByUser.has(row.user_id)) latestMbtiByUser.set(row.user_id, row.mbti_code);
  }

  const meStudyLevel = myProfileRes.data?.study_level ?? null;

  return visibleProfiles
    .map((profile) =>
      toBuddySuggestion({
        meMbti: result.mbti_code,
        meStudyLevel,
        myHobbies,
        profile,
        buddyMbti: latestMbtiByUser.get(profile.id) ?? null,
        buddyHobbies: hobbiesByUser.get(profile.id) ?? [],
      })
    )
    .sort((a, b) => b.compatibility - a.compatibility || a.handle.localeCompare(b.handle, "fr"))
    .slice(0, 3);
}


export default function TestResultsPage() {
  const [state, setState] = useState<ResultState>({ status: "loading" });

  useEffect(() => {
    const run = async () => {
      setState({ status: "loading" });
      clearLegacyTestFlowStorage();
      let fallback: StoredResult | null = null;

      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setState({ status: "error", message: userError.message });
          return;
        }

        if (!user) {
          setState({ status: "empty" });
          return;
        }

        fallback = readLocalResult(user.id);
        const { data, error } = await supabase
          .from("test_results")
          .select("mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<TestResultRow>();

        if (error) {
          if (fallback) setState({ status: "ready", result: fallback, buddies: [] });
          else setState({ status: "error", message: error.message });
          return;
        }

        if (!data) {
          if (fallback) setState({ status: "ready", result: fallback, buddies: [] });
          else setState({ status: "empty" });
          return;
        }

        const safeResult: StoredResult = {
            mbti_code: data.mbti_code,
            mbti_name: data.mbti_name,
            big_five_scores: data.big_five_scores,
            stress_score: clamp(data.stress_score),
            balance_score: clamp(data.balance_score),
            calculated_at: data.created_at,
          };

        try {
          const buddies = await loadBuddySuggestions(user.id, safeResult);
          setState({ status: "ready", result: safeResult, buddies });
        } catch {
          setState({ status: "ready", result: safeResult, buddies: [] });
        }
      } catch (error) {
        if (fallback) {
          setState({ status: "ready", result: fallback, buddies: [] });
        } else {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Impossible de charger tes resultats.",
          });
        }
      }
    };

    void run();
  }, []);

  const secondaryCtas = useMemo(
    () =>
      [
        { href: "/buddies", label: "Voir les suggestions buddies" },
        { href: "/results", label: "Voir le detail des resultats" },
      ].filter((item) => AVAILABLE_ROUTES.has(item.href)),
    []
  );

  if (state.status === "loading") {
    return (
      <main className="test-page results-page-wrap">
        <div className="test-shell">
          <section className="results-state-card">
            <h1>Chargement de tes resultats...</h1>
            <p>On recupere ton dernier profil Emotion Lab.</p>
          </section>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="test-page results-page-wrap">
        <div className="test-shell">
          <section className="results-state-card">
            <h1>Impossible d&apos;afficher tes resultats</h1>
            <p>{state.message}</p>
            <Link className="btn btn-primary" href="/test/intro">
              Revenir au test
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (state.status === "empty") {
    return (
      <main className="test-page results-page-wrap">
        <div className="test-shell">
          <section className="results-state-card">
            <h1>Aucun resultat disponible</h1>
            <p>Commence par passer le test pour generer ton profil complet.</p>
            <Link className="btn btn-primary" href="/test/intro">
              Demarrer le test
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const { result } = state;
  const axes = mbtiAxesFromScores(result.mbti_code, result.big_five_scores);
  const stress = statusForStress(result.stress_score);
  const balance = statusForBalance(result.balance_score);
  const explanation = MBTI_EXPLANATIONS[result.mbti_code] ?? "Ton profil montre un bon potentiel de progression emotionnelle et relationnelle.";
  const buddies = state.buddies;

  return (
    <main className="test-page results-page-wrap">
      <div className="test-shell results-shell">
        <div className="results-page">
          <ResultsHero mbtiCode={result.mbti_code} mbtiName={result.mbti_name} explanation={explanation} />

          <div className="results-body">
            <MBTIAxes axes={axes} />
            <BigFiveRadar scores={result.big_five_scores} />

            <section className="results-section">
              <div className="results-section-title">Comment tu fonctionnes</div>
              <div className="gauges-grid">
                <GaugeCard
                  label="Niveau de stress"
                  value={result.stress_score}
                  status={stress.label}
                  tone={stress.tone}
                  scale={["Faible", "Modere", "Eleve"]}
                  description="Tu traverses peut-etre une phase intense. Le chatbot et un buddy empathique peuvent t'aider."
                />
                <GaugeCard
                  label="Style d'organisation"
                  value={result.balance_score}
                  status={balance.label}
                  tone={balance.tone}
                  scale={["Spontane", "Equilibre", "Organise"]}
                  description="Ton score reflete ton equilibre entre souplesse et structure dans ton quotidien."
                />
              </div>
            </section>

            <section className="results-section">
              <div className="results-section-title">Tes 3 buddies suggeres</div>
              <div className="buddies-grid">
                {buddies.length > 0 ? buddies.map((buddy) => (
                  <BuddySuggestionCard buddy={buddy} key={buddy.id} />
                )) : <p className="results-empty-inline">Aucun buddy suggere pour le moment.</p>}
              </div>
            </section>

            <div className="results-footer">
              <Link className="btn btn-primary" href="/dashboard">
                Continuer vers mon dashboard
              </Link>
              {secondaryCtas.length > 0 ? (
                <Link className="btn btn-tertiary" href={secondaryCtas[0].href}>
                  {secondaryCtas[0].label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .results-page-wrap {
          background:
            radial-gradient(760px 360px at 0% -12%, rgba(247, 186, 193, 0.32), transparent 62%),
            radial-gradient(760px 360px at 100% -12%, rgba(142, 192, 201, 0.28), transparent 62%),
            var(--fond-creme);
        }
        .results-shell {
          max-width: 1120px;
          padding-top: 20px;
          padding-bottom: 32px;
        }
        .results-page {
          display: grid;
          gap: 18px;
        }
        .results-state-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 18px;
          padding: 24px;
        }
        .results-state-card h1 {
          margin: 0 0 8px;
        }
        .results-state-card p {
          margin: 0 0 16px;
          color: var(--texte-gris);
        }
        .results-hero {
          background: linear-gradient(132deg, #7e3d5e, #8a6889 52%, #62809a);
          color: #fff;
          border-radius: 22px;
          padding: 30px 24px;
          box-shadow: 0 22px 56px rgba(48, 36, 55, 0.18);
        }
        .eyebrow {
          display: inline-flex;
          font-size: 12px;
          letter-spacing: 0.04em;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
        }
        .results-code {
          margin-top: 14px;
          font-family: "Poppins", sans-serif;
          font-weight: 800;
          font-size: clamp(42px, 7vw, 62px);
          line-height: 1;
        }
        .results-name {
          margin-top: 6px;
          font-family: "Poppins", sans-serif;
          font-size: clamp(24px, 4.5vw, 34px);
          font-weight: 700;
        }
        .results-tagline {
          margin: 10px 0 0;
          max-width: 740px;
          color: rgba(255, 255, 255, 0.92);
        }
        .results-share {
          margin-top: 16px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 600;
        }
        .results-body {
          display: grid;
          gap: 16px;
        }
        .results-section {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 18px;
          padding: 18px;
        }
        .results-section-title {
          margin: 0 0 14px;
          font-size: 18px;
          font-weight: 700;
          font-family: "Poppins", sans-serif;
          color: var(--plum);
        }
        .axes-grid {
          display: grid;
          gap: 12px;
        }
        .axe-row {
          display: grid;
          gap: 8px;
        }
        .axe-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          color: var(--texte-clair);
        }
        .axe-letter.active {
          color: var(--plum);
          font-weight: 700;
        }
        .axe-track {
          height: 12px;
          border-radius: 999px;
          background: #ece7f1;
          overflow: hidden;
        }
        .axe-fill {
          height: 100%;
          background: linear-gradient(90deg, #7e3d5e, #2e8bbf);
          border-radius: 999px;
          position: relative;
        }
        .axe-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #fff;
          background: #7e3d5e;
          position: absolute;
          right: -7px;
          top: -1px;
        }
        .big-five-grid {
          display: grid;
          gap: 14px;
        }
        .radar-card {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 10px;
          background: #f9f6fb;
        }
        .radar-svg {
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
          display: block;
        }
        .radar-grid-line {
          fill: none;
          stroke: #d7cedd;
          stroke-width: 1.4;
        }
        .radar-polygon {
          fill: rgba(126, 61, 94, 0.2);
          stroke: #7e3d5e;
          stroke-width: 2;
        }
        .radar-label {
          font-size: 12px;
          fill: var(--texte-gris);
        }
        .forces-card {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 14px;
          background: #fff;
          display: grid;
          gap: 10px;
        }
        .forces-card h3 {
          margin: 0;
          font-size: 16px;
        }
        .force-item {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 10px;
          align-items: start;
        }
        .force-icon {
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
        .force-content h4 {
          margin: 0 0 2px;
          font-size: 14px;
        }
        .force-content p {
          margin: 0;
          font-size: 13px;
          color: var(--texte-gris);
        }
        .gauges-grid {
          display: grid;
          gap: 12px;
        }
        .gauge-card {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 14px;
        }
        .gauge-label {
          color: var(--texte-clair);
          font-size: 13px;
        }
        .gauge-value {
          margin-top: 4px;
          font-family: "Poppins", sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: var(--plum);
        }
        .gauge-value span {
          font-size: 17px;
          color: var(--texte-clair);
        }
        .gauge-status {
          font-size: 13px;
          font-weight: 700;
        }
        .gauge-status.faible,
        .gauge-value-faible {
          color: #0e9f6e;
        }
        .gauge-status.modere,
        .gauge-value-modere {
          color: #d97706;
        }
        .gauge-status.eleve,
        .gauge-value-eleve {
          color: #dc2626;
        }
        .gauge-status.equilibre,
        .gauge-value-equilibre {
          color: #0284c7;
        }
        .gauge-track {
          margin-top: 8px;
          height: 10px;
          border-radius: 999px;
          background: #ece7f1;
          overflow: hidden;
        }
        .gauge-fill {
          height: 100%;
        }
        .gauge-fill.faible {
          background: #0e9f6e;
        }
        .gauge-fill.modere {
          background: #d97706;
        }
        .gauge-fill.eleve {
          background: #dc2626;
        }
        .gauge-fill.equilibre {
          background: #0284c7;
        }
        .gauge-scale {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--texte-clair);
        }
        .gauge-card p {
          margin: 10px 0 0;
          color: var(--texte-gris);
          font-size: 13px;
        }
        .buddies-grid {
          display: grid;
          gap: 12px;
        }
        .buddy-card {
          position: relative;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 14px;
        }
        .buddy-compat {
          position: absolute;
          right: 12px;
          top: 10px;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          background: #eef7fb;
          color: #13658a;
          font-weight: 700;
        }
        .buddy-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .buddy-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--gradient-signature);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-family: "Poppins", sans-serif;
        }
        .buddy-info h4 {
          margin: 0;
          font-size: 15px;
        }
        .buddy-meta {
          font-size: 12px;
          color: var(--texte-clair);
        }
        .buddy-tagline {
          margin: 10px 0;
          color: var(--texte-gris);
          font-size: 13px;
        }
        .buddy-common {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .chip {
          border-radius: 999px;
          border: 1px solid var(--bordure);
          background: #f8f6fb;
          font-size: 12px;
          padding: 5px 9px;
        }
        .buddy-action {
          margin-top: 12px;
        }
        .buddy-action .btn {
          width: 100%;
          min-height: 42px;
          padding: 10px 14px;
        }
        .results-empty-inline {
          margin: 0;
          color: var(--texte-gris);
          font-size: 14px;
        }
        .results-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }
        @media (min-width: 900px) {
          .big-five-grid {
            grid-template-columns: 1fr 1.1fr;
            align-items: stretch;
          }
          .gauges-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .buddies-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}

