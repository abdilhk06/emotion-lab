"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { BigFiveRadar } from "@/components/results/BigFiveRadar";
import { BuddySuggestionCard, type BuddySuggestion } from "@/components/results/BuddySuggestionCard";
import { GaugeCard } from "@/components/results/GaugeCard";
import { MBTIAxes, type MBTIAxisItem } from "@/components/results/MBTIAxes";
import { ResultsHero } from "@/components/results/ResultsHero";
import type { BigFiveScores } from "@/lib/calculate-result";
import { computeBuddyCompatibilityScore } from "@/lib/compatibility";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  bio: string | null;
  looking_for: string | null;
  study_level: string | null;
  is_visible: boolean | null;
};

type ResultRow = {
  user_id: string;
  mbti_code: string | null;
  mbti_name: string | null;
  big_five_scores: BigFiveScores | null;
  stress_score: number | null;
  balance_score: number | null;
  created_at: string;
};

type HobbyRow = {
  user_id: string;
  hobby: string;
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
  | { status: "ready"; profile: ProfileRow; result: StoredResult; hobbies: string[]; buddies: BuddySuggestion[] };

const MBTI_EXPLANATIONS: Record<string, string> = {
  ENFJ: "Tu inspires les gens autour de toi par ta chaleur et ton sens de l'autre.",
  INFJ: "Tu relies intuition, profondeur et attention fine aux autres.",
  ENFP: "Tu apportes energie, creativite et curiosite dans ce que tu entreprends.",
  INFP: "Tu avances avec authenticite, sensibilite et recherche de sens.",
  ENTJ: "Tu structures vite les idees et tu mobilises les autres vers l'action.",
  INTJ: "Tu combines vision, autonomie et rigueur pour construire sur la duree.",
};

function clamp(value: number | null | undefined): number {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function hasScores(scores: BigFiveScores | null): scores is BigFiveScores {
  return Boolean(scores) && ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"].every((key) => typeof scores?.[key as keyof BigFiveScores] === "number");
}

function mbtiAxesFromScores(code: string, scores: BigFiveScores): MBTIAxisItem[] {
  const letters = code.padEnd(4, "X").slice(0, 4).split("");
  const axes: MBTIAxisItem[] = [
    { leftLabel: "E — Extraversion", rightLabel: "Introversion — I", activeSide: letters[0] === "E" ? "left" : "right", value: letters[0] === "E" ? scores.extraversion : 100 - scores.extraversion },
    { leftLabel: "Sensation — S", rightLabel: "iNtuition — N", activeSide: letters[1] === "S" ? "left" : "right", value: letters[1] === "S" ? 100 - scores.openness : scores.openness },
    { leftLabel: "Logique — T", rightLabel: "Affect — F", activeSide: letters[2] === "T" ? "left" : "right", value: letters[2] === "T" ? 100 - scores.agreeableness : scores.agreeableness },
    { leftLabel: "J — Structure", rightLabel: "Flexibilite — P", activeSide: letters[3] === "J" ? "left" : "right", value: letters[3] === "J" ? scores.conscientiousness : 100 - scores.conscientiousness },
  ];
  return axes.map((axis) => ({ ...axis, value: clamp(axis.value) }));
}

function statusForStress(value: number) {
  if (value < 35) return { label: "Faible", tone: "low" as const, description: "Tu sembles globalement bien gerer la pression actuelle." };
  if (value < 70) return { label: "Modéré", tone: "moderate" as const, description: "Tu traverses une periode intense. Notre chatbot et un.e Buddy empathique peuvent t'aider." };
  return { label: "Élevé", tone: "high" as const, description: "Ton niveau de pression merite de vrais temps de recuperation et du soutien." };
}

function statusForBalance(value: number) {
  if (value < 40) return { label: "Spontane", tone: "moderate" as const, description: "Tu privilegies l'adaptation rapide. Un cadre leger peut t'aider a stabiliser tes priorites." };
  if (value < 75) return { label: "Équilibré", tone: "balanced" as const, description: "Tu as un bon equilibre entre rigueur et souplesse. La matrice d'Eisenhower pourrait encore t'aider." };
  return { label: "Organisé", tone: "balanced" as const, description: "Tu fonctionnes bien avec des routines claires et un cadre visible." };
}

function initialFor(profile: ProfileRow): string {
  return (profile.pseudo?.trim().replace(/^@/, "").charAt(0) || "?").toUpperCase();
}

function buildBuddies(params: {
  userId: string;
  profile: ProfileRow;
  result: StoredResult;
  profiles: ProfileRow[];
  results: ResultRow[];
  hobbies: HobbyRow[];
}): BuddySuggestion[] {
  const latestResultByUser = new Map<string, ResultRow>();
  for (const row of params.results) {
    if (!latestResultByUser.has(row.user_id)) latestResultByUser.set(row.user_id, row);
  }

  const hobbiesByUser = new Map<string, Set<string>>();
  for (const row of params.hobbies) {
    const set = hobbiesByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.hobby);
    hobbiesByUser.set(row.user_id, set);
  }

  const myHobbies = hobbiesByUser.get(params.userId) ?? new Set<string>();
  return params.profiles
    .filter((profile) => profile.id !== params.userId && profile.is_visible !== false)
    .map((profile) => {
      const buddyResult = latestResultByUser.get(profile.id);
      const sharedHobbies = Array.from(hobbiesByUser.get(profile.id) ?? []).filter((hobby) => myHobbies.has(hobby));
      const compatibility = computeBuddyCompatibilityScore({
        sharedHobbiesCount: sharedHobbies.length,
        currentMbti: params.result.mbti_code,
        buddyMbti: buddyResult?.mbti_code,
        sameStudyLevel: Boolean(params.profile.study_level && profile.study_level && params.profile.study_level === profile.study_level),
      });

      return {
        id: profile.id,
        handle: profile.pseudo?.trim() || "@buddy",
        initials: initialFor(profile),
        mbti: buddyResult?.mbti_code?.trim() || "MBTI non renseigne",
        level: profile.study_level?.trim() || "Niveau non precise",
        tagline: profile.looking_for?.trim() || profile.bio?.trim() || "Profil visible, bio a completer.",
        interests: sharedHobbies,
        compatibility,
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility || a.handle.localeCompare(b.handle, "fr"))
    .slice(0, 3);
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

        const [profileRes, latestResultRes, profilesRes, resultsRes, hobbiesRes] = await Promise.all([
          supabase.from("profiles").select("id, pseudo, bio, looking_for, study_level, is_visible").eq("id", user.id).maybeSingle<ProfileRow>(),
          supabase.from("test_results").select("user_id, mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle<ResultRow>(),
          supabase.from("profiles").select("id, pseudo, bio, looking_for, study_level, is_visible").eq("is_visible", true).returns<ProfileRow[]>(),
          supabase.from("test_results").select("user_id, mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at").order("created_at", { ascending: false }).returns<ResultRow[]>(),
          supabase.from("user_hobbies").select("user_id, hobby").returns<HobbyRow[]>(),
        ]);

        const firstError = profileRes.error ?? latestResultRes.error ?? profilesRes.error ?? resultsRes.error ?? hobbiesRes.error;
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

        const result: StoredResult = {
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
        };
        const hobbies = (hobbiesRes.data ?? []).filter((item) => item.user_id === user.id).map((item) => item.hobby);
        const buddies = buildBuddies({
          userId: user.id,
          profile: profileRes.data,
          result,
          profiles: profilesRes.data ?? [],
          results: resultsRes.data ?? [],
          hobbies: hobbiesRes.data ?? [],
        });

        setState({ status: "ready", profile: profileRes.data, result, hobbies, buddies });
      } catch (error) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Impossible de charger tes resultats." });
      }
    };

    void run();
  }, [router]);

  const content = useMemo(() => {
    if (state.status === "loading") return <StateCard title="Chargement de tes resultats..." text="On recupere ton profil, ton dernier test et tes suggestions Buddy." />;
    if (state.status === "error") return <StateCard title="Impossible d'afficher tes resultats" text={state.message} error />;
    if (state.status === "no-profile") return <StateCard title="Profil introuvable" text="Complete ton profil pour afficher tes resultats connectes." primaryHref="/profile" primaryLabel="Completer mon profil" />;
    if (state.status === "no-result") return <StateCard title="Aucun test complete" text="Passe le test pour generer ton profil Emotion Lab." primaryHref="/test/intro" primaryLabel="Demarrer le test" />;

    const { result, buddies } = state;
    const axes = mbtiAxesFromScores(result.mbti_code, result.big_five_scores);
    const stress = statusForStress(result.stress_score);
    const balance = statusForBalance(result.balance_score);
    const explanation = MBTI_EXPLANATIONS[result.mbti_code] ?? "Ton profil montre ta maniere naturelle d'entrer en relation, de t'organiser et de recuperer.";

    return (
      <div className="connected-results">
        <div className="results-container">
          <ResultsHero mbtiCode={result.mbti_code} mbtiName={result.mbti_name} explanation={`« ${explanation} »`} ctaLabel="📥 Partager mon profil" eyebrow="✨ Ton profil est prêt" />
          <div className="results-body">
            <section className="results-section">
              <div className="results-section-title">Tes 4 dimensions</div>
              <MBTIAxes axes={axes} title={null} />
            </section>
            <section className="results-section">
              <div className="results-section-title">Tes super-pouvoirs</div>
              <BigFiveRadar scores={result.big_five_scores} title={null} />
            </section>

            <section className="results-section function-section">
              <div className="results-section-title">COMMENT TU FONCTIONNES</div>
              <div className="gauges-grid">
                <GaugeCard label="Niveau de stress" value={result.stress_score} status={stress.label} tone={stress.tone} scale={["Faible", "Modéré", "Élevé"]} description={stress.description} />
                <GaugeCard label="Style d'organisation" value={result.balance_score} status={balance.label} tone={balance.tone} scale={["Spontané", "Équilibré", "Organisé"]} description={balance.description} />
              </div>
            </section>

            <section className="results-section buddies-section">
              <div className="results-section-title">TES 3 BUDDIES SUGGÉRÉ·ES</div>
              {buddies.length === 0 ? (
                <div className="empty-inline">Aucun buddy visible trouve pour le moment.</div>
              ) : (
                <div className="buddies-grid">
                  {buddies.map((buddy) => (
                    <BuddySuggestionCard buddy={buddy} key={buddy.id} />
                  ))}
                </div>
              )}
            </section>

            <div className="results-footer">
              <button className="btn btn-pdf" type="button">📥 Télécharger mes résultats (PDF)</button>
              <Link className="btn btn-outline" href="/dashboard">Explorer mon dashboard →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }, [state]);

  return (
    <AppLayout title="Mes resultats">
      {content}
      <style jsx>{`
        .connected-results {
          margin: 0;
          padding: 0 0 52px;
          background: #fffdfd;
          min-height: 100vh;
        }
        .results-container {
          max-width: 1120px;
          margin: 0 auto;
          padding-top: 0;
        }
        .results-body {
          padding: 48px 0 0;
          display: grid;
          gap: 40px;
        }
        :global(.results-hero) {
          min-height: 505px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #fff;
          border-radius: 18px;
          padding: 66px 24px 60px;
          background: linear-gradient(126deg, #90446d 0%, #8e7895 54%, #2d99c8 100%);
          box-shadow: none;
          overflow: hidden;
        }
        :global(.results-hero-head) {
          display: grid;
          justify-items: center;
          gap: 26px;
        }
        :global(.eyebrow) {
          margin-bottom: 26px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          padding: 8px 17px;
          font-size: 14px;
          font-weight: 500;
        }
        :global(.results-code) {
          font-size: clamp(4.8rem, 10vw, 7.25rem);
          line-height: 0.9;
          font-weight: 900;
          color: #fffdf9;
        }
        :global(.results-name) {
          margin-top: 25px;
          font-size: clamp(1.9rem, 4vw, 2.1rem);
          font-weight: 800;
        }
        :global(.results-tagline) {
          max-width: 560px;
          margin: 26px auto 0;
          color: rgba(255, 255, 255, 0.94);
          font-size: 17px;
          font-style: italic;
          font-weight: 600;
          line-height: 1.45;
        }
        :global(.results-share) {
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: #89406a;
          padding: 13px 28px;
          font-weight: 800;
          box-shadow: 0 14px 28px rgba(39, 34, 64, 0.2);
          min-height: 43px;
        }
        :global(.results-section) {
          background: transparent;
          border: 0;
          padding: 0;
        }
        :global(.results-section-title) {
          margin: 0 0 18px;
          color: #8a315f;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        :global(.axes-grid) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
        }
        :global(.axe-row),
        :global(.radar-card),
        :global(.forces-card),
        :global(.gauge-card),
        :global(.buddy-card) {
          background: #fff;
          border: 1px solid #e4dcea;
          border-radius: 14px;
          box-shadow: none;
          min-width: 0;
        }
        :global(.axe-row) {
          min-height: 84px;
          padding: 19px 20px;
          display: grid;
          gap: 12px;
          align-content: center;
        }
        :global(.axe-header) {
          display: flex;
          justify-content: space-between;
          color: #26365a;
          font-weight: 800;
          font-size: 14px;
        }
        :global(.axe-letter.active) {
          color: #8a315f;
          font-size: 16px;
        }
        :global(.axe-track) {
          height: 8px;
          border-radius: 999px;
          background: #e8e1ec;
        }
        :global(.axe-fill) {
          height: 100%;
          position: relative;
          border-radius: 999px;
          background: linear-gradient(90deg, #8a3b65, #2894c2);
        }
        :global(.axe-dot) {
          position: absolute;
          left: -8px;
          top: -4px;
          width: 16px;
          height: 16px;
          border: 3px solid #8a3b65;
          background: #fff;
          border-radius: 999px;
        }
        :global(.big-five-grid) {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 16px;
          width: 100%;
        }
        :global(.radar-card) {
          min-height: 340px;
          display: grid;
          place-items: center;
          padding: 22px;
          overflow: hidden;
        }
        :global(.radar-svg) {
          width: min(360px, 100%);
          max-height: 300px;
        }
        :global(.forces-card) {
          padding: 24px;
          background: #f4eff7;
        }
        :global(.forces-card h3) {
          margin: 0 0 22px;
          color: #8a315f;
          font-size: 24px;
        }
        :global(.force-item) {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px dashed #ded2e5;
        }
        :global(.force-item:last-child) {
          border-bottom: 0;
        }
        :global(.force-icon) {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #fff;
          color: #8a315f;
          font-weight: 900;
          font-size: 20px;
        }
        :global(.force-content h4) {
          margin: 0 0 4px;
          font-size: 16px;
          color: #07123a;
        }
        :global(.force-content p) {
          margin: 0;
          color: #24375e;
          line-height: 1.45;
        }
        :global(.gauges-grid) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          align-items: stretch;
        }
        :global(.gauge-card) {
          width: auto;
          min-width: 0;
          min-height: 220px;
          padding: 26px;
        }
        :global(.gauge-label) {
          color: #26365a;
          font-size: 15px;
        }
        :global(.gauge-main) {
          margin-top: 8px;
        }
        :global(.gauge-value) {
          font-size: 38px;
          font-weight: 900;
          line-height: 1;
        }
        :global(.gauge-value span) {
          color: #66738e;
          font-size: 20px;
        }
        :global(.gauge-status) {
          margin-top: 6px;
          font-size: 14px;
          font-weight: 900;
        }
        :global(.gauge-value-modere),
        :global(.gauge-status.modere) {
          color: #f07f2f;
        }
        :global(.gauge-value-equilibre),
        :global(.gauge-status.equilibre) {
          color: #35ba72;
        }
        :global(.gauge-value-eleve),
        :global(.gauge-status.eleve) {
          color: #e53e3e;
        }
        :global(.gauge-value-faible),
        :global(.gauge-status.faible) {
          color: #35ba72;
        }
        :global(.gauge-track) {
          height: 10px;
          margin-top: 15px;
          border-radius: 999px;
          background: #e7e1eb;
        }
        :global(.gauge-fill) {
          height: 100%;
          border-radius: 999px;
        }
        :global(.gauge-fill.modere) {
          background: linear-gradient(90deg, #6fc88e, #f07f2f);
        }
        :global(.gauge-fill.equilibre) {
          background: linear-gradient(90deg, #6fc8b2, #35ba72);
        }
        :global(.gauge-fill.eleve) {
          background: linear-gradient(90deg, #f07f2f, #e53e3e);
        }
        :global(.gauge-fill.faible) {
          background: linear-gradient(90deg, #6fc8b2, #35ba72);
        }
        :global(.gauge-scale) {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          color: #697796;
          font-size: 11px;
        }
        :global(.gauge-card p) {
          color: #24375e;
          line-height: 1.55;
        }
        :global(.buddies-grid) {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
          width: 100%;
        }
        :global(.buddy-card) {
          position: relative;
          width: auto !important;
          max-width: none !important;
          padding: 20px;
          display: grid;
          grid-template-rows: auto minmax(42px, auto) auto auto;
          gap: 16px;
          min-width: 0;
          min-height: 256px;
        }
        :global(.buddy-compat) {
          position: absolute;
          right: 16px;
          top: 16px;
          border-radius: 999px;
          padding: 5px 10px;
          color: #35ba72;
          background: #ebfff0;
          font-size: 13px;
          font-weight: 900;
        }
        :global(.buddy-header) {
          display: flex;
          gap: 14px;
          align-items: center;
          padding-right: 52px;
        }
        :global(.buddy-avatar) {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: #fff;
          font-size: 21px;
          font-weight: 900;
          background: linear-gradient(135deg, #9d4b7a, #2f91bd);
        }
        :global(.buddy-info h4) {
          margin: 0;
          color: #07123a;
          font-size: 19px;
          overflow-wrap: anywhere;
        }
        :global(.buddy-meta) {
          color: #65738f;
          font-size: 13px;
        }
        :global(.buddy-tagline) {
          margin: 0;
          min-height: 42px;
          color: #26365a;
          font-size: 14px;
          font-style: italic;
          line-height: 1.45;
        }
        :global(.buddy-common) {
          min-height: 30px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-content: flex-start;
        }
        :global(.chip) {
          border-radius: 999px;
          background: #f3edf7;
          color: #4c5069;
          padding: 5px 10px;
          font-size: 13px;
        }
        :global(.chip-muted) {
          color: #69738a;
          background: #f6f3f8;
        }
        :global(.buddy-action .btn) {
          width: 100%;
          min-height: 42px;
          border-radius: 10px;
          background: #8a3b65;
          margin-top: auto;
        }
        .empty-inline,
        .state-card {
          background: #fff;
          border: 1px solid #e4dcea;
          border-radius: 14px;
          padding: 22px;
          color: #26365a;
        }
        .state-card {
          max-width: 760px;
          margin: 0 auto;
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
        .results-footer {
          display: flex;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-top: 34px;
        }
        .results-footer :global(.btn) {
          min-height: 44px;
          border-radius: 10px;
          padding-inline: 20px;
        }
        .results-footer :global(.btn-pdf) {
          border: 1px solid #2f91bd;
          background: #2f91bd;
          color: #fff;
          font-weight: 900;
        }
        .results-footer :global(.btn-outline) {
          background: #fff;
          color: #8a315f;
          border: 1px solid #8a315f;
        }
        @media (max-width: 780px) {
          .connected-results {
            padding-bottom: 44px;
          }
          :global(.axes-grid),
          :global(.big-five-grid),
          :global(.gauges-grid),
          :global(.buddies-grid) {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          :global(.results-hero) {
            min-height: 430px;
            padding-inline: 16px;
            border-radius: 16px;
          }
          :global(.results-code) {
            font-size: 4.2rem;
          }
          .results-footer :global(.btn) {
            width: 100%;
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
