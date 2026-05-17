"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { computeBuddyCompatibilityScore } from "@/lib/compatibility";
import { findOrCreateConversationBetweenUsers } from "@/lib/supabase/conversations";
import { BigFiveRadar } from "@/components/results/BigFiveRadar";
import type { BuddySuggestion } from "@/components/results/BuddySuggestionCard";
import { MBTIAxes, type MBTIAxisItem } from "@/components/results/MBTIAxes";
import { ResultsHero } from "@/components/results/ResultsHero";
import { ResultPdfDocument, type ResultPdfData } from "@/components/results/ResultPdfDocument";
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
  | {
      status: "ready";
      result: StoredResult;
      buddies: BuddySuggestion[];
      profile: { pseudo: string | null; study_level: string | null; bio: string | null; looking_for: string | null };
      hobbies: string[];
    };

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

type BuddyRequestRow = {
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
};

type ConversationRow = {
  id: string;
  user_1_id: string | null;
  user_2_id: string | null;
};

type BuddyRelationship = {
  status: "none" | "pending_sent" | "pending_received" | "accepted";
  conversationId: string | null;
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

function sanitizePdfFilenamePart(value: string | null | undefined): string {
  const clean = value?.trim().replace(/^@+/, "") || "profil";
  return clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "profil";
}

function buildPdfData(
  result: StoredResult,
  profile: { pseudo: string | null; study_level: string | null; bio: string | null; looking_for: string | null },
  hobbies: string[]
): ResultPdfData {
  return {
    generatedAt: new Date().toISOString(),
    profile: {
      pseudo: profile.pseudo,
      studyLevel: profile.study_level,
      bio: profile.bio,
      lookingFor: profile.looking_for,
    },
    hobbies,
    result: {
      mbtiCode: result.mbti_code,
      mbtiName: result.mbti_name,
      bigFiveScores: result.big_five_scores,
      stressScore: result.stress_score,
      balanceScore: result.balance_score,
      createdAt: result.calculated_at ?? new Date().toISOString(),
    },
  };
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
    handle: params.profile.pseudo?.trim().replace(/^@+/, "") || "buddy",
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
  const router = useRouter();
  const [state, setState] = useState<ResultState>({ status: "loading" });
  const [relationshipByBuddyId, setRelationshipByBuddyId] = useState<Record<string, BuddyRelationship>>({});

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
          router.replace("/login");
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
          if (fallback) setState({ status: "ready", result: fallback, buddies: [], profile: { pseudo: null, study_level: null, bio: null, looking_for: null }, hobbies: [] });
          else setState({ status: "error", message: error.message });
          return;
        }

        if (!data) {
          if (fallback) setState({ status: "ready", result: fallback, buddies: [], profile: { pseudo: null, study_level: null, bio: null, looking_for: null }, hobbies: [] });
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
          const [buddies, profileRes, hobbiesRes] = await Promise.all([
            loadBuddySuggestions(user.id, safeResult),
            supabase.from("profiles").select("pseudo,study_level,bio,looking_for").eq("id", user.id).maybeSingle<{ pseudo: string | null; study_level: string | null; bio: string | null; looking_for: string | null }>(),
            supabase.from("user_hobbies").select("hobby").eq("user_id", user.id),
          ]);
          setState({
            status: "ready",
            result: safeResult,
            buddies,
            profile: profileRes.data ?? { pseudo: null, study_level: null, bio: null, looking_for: null },
            hobbies: (hobbiesRes.data ?? []).map((row) => row.hobby).filter(Boolean).sort((a, b) => a.localeCompare(b, "fr")),
          });
          const relationships = await loadBuddyRelationships(user.id, buddies.map((item) => item.id));
          setRelationshipByBuddyId(relationships);
        } catch {
          setState({ status: "ready", result: safeResult, buddies: [], profile: { pseudo: null, study_level: null, bio: null, looking_for: null }, hobbies: [] });
          setRelationshipByBuddyId({});
        }
      } catch (error) {
        if (fallback) {
          setState({ status: "ready", result: fallback, buddies: [], profile: { pseudo: null, study_level: null, bio: null, looking_for: null }, hobbies: [] });
        } else {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Impossible de charger tes resultats.",
          });
        }
      }
    };

    void run();
  }, [router]);

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
      <AppLayout title="Mes resultats">
      <main className="results-page-wrap">
        <div className="test-shell">
          <section className="results-state-card">
            <h1>Chargement de tes resultats...</h1>
            <p>On recupere ton dernier profil Emotion Lab.</p>
          </section>
        </div>
      </main>
      </AppLayout>
    );
  }

  if (state.status === "error") {
    return (
      <AppLayout title="Mes resultats">
      <main className="results-page-wrap">
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
      </AppLayout>
    );
  }

  if (state.status === "empty") {
    return (
      <AppLayout title="Mes resultats">
      <main className="results-page-wrap">
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
      </AppLayout>
    );
  }

  const { result } = state;
  const axes = mbtiAxesFromScores(result.mbti_code, result.big_five_scores);
  const stress = statusForStress(result.stress_score);
  const balance = statusForBalance(result.balance_score);
  const stressStatusLabel = stress.tone === "low" ? "Faible" : stress.tone === "moderate" ? "Modere - eleve" : "Eleve";
  const balanceStatusLabel = balance.tone === "moderate" ? "Spontane" : balance.label;
  const explanation = MBTI_EXPLANATIONS[result.mbti_code] ?? "Ton profil montre un bon potentiel de progression emotionnelle et relationnelle.";
  const buddies = state.buddies;
  const pdfData = buildPdfData(result, state.profile, state.hobbies);
  const pdfFileName = `emotion-lab-resultats-${sanitizePdfFilenamePart(state.profile.pseudo)}.pdf`;
  const onOpenBuddyProfile = (buddyId: string) => router.push(`/buddies/${buddyId}`);
  const onBuddyPrimaryAction = async (buddyId: string) => {
    const relation = relationshipByBuddyId[buddyId];
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (relation?.status === "pending_sent" || relation?.status === "pending_received") return;
    if (relation?.status === "accepted") {
      const conversationId = relation.conversationId ?? (await findOrCreateConversationBetweenUsers(supabase, user.id, buddyId));
      router.push(`/messages/${conversationId}`);
      return;
    }
    const insertRes = await supabase.from("buddy_requests").insert({
      sender_id: user.id,
      receiver_id: buddyId,
      message: null,
      status: "pending",
    });
    if (insertRes.error) return;
    setRelationshipByBuddyId((prev) => ({ ...prev, [buddyId]: { status: "pending_sent", conversationId: prev[buddyId]?.conversationId ?? null } }));
  };

  return (
    <AppLayout title="Mes resultats">
    <main className="results-page-wrap">
      <div className="test-shell results-shell">
        <div className="results-page">
          <ResultsHero mbtiCode={result.mbti_code} mbtiName={result.mbti_name} explanation={explanation} ctaLabel="PDF" />

          <div className="results-body">
            <MBTIAxes axes={axes} />
            <BigFiveRadar scores={result.big_five_scores} />

            <section className="results-section function-section">
              <h2 className="section-kicker">COMMENT TU FONCTIONNES</h2>
              <div className="function-grid">
                <article className="function-card">
                  <h3>Niveau de stress</h3>
                  <div className="score orange"><span>{result.stress_score}</span><small>/100</small></div>
                  <p className="status orange">● {stressStatusLabel}</p>
                  <div className="bar"><span className="bar-fill stress" style={{ width: `${result.stress_score}%` }} /></div>
                  <div className="scale"><span>Faible</span><span>Modere</span><span>Eleve</span></div>
                  <p className="description">Tu traverses peut-etre une phase intense. Le chatbot et un buddy empathique peuvent t&apos;aider.</p>
                </article>
                <article className="function-card">
                  <h3>Style d&apos;organisation</h3>
                  <div className="score green"><span>{result.balance_score}</span><small>/100</small></div>
                  <p className="status green">● {balanceStatusLabel}</p>
                  <div className="bar"><span className="bar-fill organization" style={{ width: `${result.balance_score}%` }} /></div>
                  <div className="scale"><span>Spontane</span><span>Equilibre</span><span>Organise</span></div>
                  <p className="description">Tu as un bon equilibre entre rigueur et souplesse. La matrice d&apos;Eisenhower pourrait encore t&apos;aider.</p>
                </article>
              </div>
            </section>

            <section className="results-section buddies-section">
              <h2 className="section-kicker">TES 3 BUDDIES SUGGERES</h2>
              <div className="buddies-grid">
                {buddies.length > 0 ? buddies.map((buddy) => (
                  <article className="buddy-card" key={buddy.id}>
                    <span className="compat">{buddy.compatibility}%</span>
                    <button type="button" className="buddy-head buddy-head-link" onClick={() => onOpenBuddyProfile(buddy.id)}>
                      <div className="avatar">{buddy.initials}</div>
                      <div>
                        <h3>{buddy.handle}</h3>
                        <p>{buddy.mbti} · {buddy.level}</p>
                      </div>
                    </button>
                    <p className="quote">« {buddy.tagline} »</p>
                    <div className="chips">
                      {buddy.interests.length > 0 ? buddy.interests.map((interest) => (
                        <span key={`${buddy.id}-${interest}`}>{interest}</span>
                      )) : <span>Aucun hobby commun</span>}
                    </div>
                    <button
                      className="buddy-cta-btn"
                      type="button"
                      disabled={relationshipByBuddyId[buddy.id]?.status === "pending_sent" || relationshipByBuddyId[buddy.id]?.status === "pending_received"}
                      onClick={() => void onBuddyPrimaryAction(buddy.id)}
                    >
                      {relationshipByBuddyId[buddy.id]?.status === "accepted"
                        ? "Envoyer un message"
                        : relationshipByBuddyId[buddy.id]?.status === "pending_sent"
                          ? "Demande envoyee"
                          : relationshipByBuddyId[buddy.id]?.status === "pending_received"
                            ? "Demande recue"
                            : "Envoyer une demande"}
                    </button>
                  </article>
                )) : <p className="results-empty-inline">Aucun buddy suggere pour le moment.</p>}
              </div>
            </section>

            <div className="results-footer section-actions">
              <PDFDownloadLink className="btn btn-tertiary" document={<ResultPdfDocument data={pdfData} />} fileName={pdfFileName}>
                {({ loading }) => (loading ? "Preparation du PDF..." : "Telecharger en PDF")}
              </PDFDownloadLink>
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

      <style jsx global>{`
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
        .section-kicker { margin: 0 0 20px; color: #7e3d5e; font-size: 14px; line-height: 1; font-weight: 800; letter-spacing: 3px; }
        .function-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 44px; }
        .function-card, .buddy-card { background: #fff; border: 1px solid #e5e0ec; border-radius: 14px; box-shadow: 0 8px 20px rgba(18, 20, 40, 0.06); }
        .function-card { padding: 26px 25px; min-height: 240px; }
        .function-card h3 { margin: 0 0 8px; font-size: 15px; font-weight: 500; color: #26395d; }
        .score { display: flex; align-items: flex-end; gap: 5px; margin-bottom: 4px; }
        .score span { font-size: 38px; line-height: 1; font-weight: 800; letter-spacing: -1px; }
        .score small { font-size: 18px; line-height: 1.2; font-weight: 800; color: #647596; }
        .orange span, .status.orange { color: #f28a33; }
        .green span, .status.green { color: #43c181; }
        .status { font-size: 13px; font-weight: 700; margin: 0 0 14px; }
        .bar { height: 10px; width: 100%; border-radius: 999px; background: #e8e1ed; overflow: hidden; margin-bottom: 8px; }
        .bar-fill { display: block; height: 100%; border-radius: 999px; }
        .bar-fill.stress { background: linear-gradient(90deg, #6ed198 0%, #f28a33 100%); }
        .bar-fill.organization { background: linear-gradient(90deg, #8ec0c9 0%, #43c181 100%); }
        .scale { display: flex; justify-content: space-between; color: #5f7191; font-size: 10px; margin-bottom: 16px; }
        .description { margin: 0; color: #24395c; font-size: 14px; line-height: 1.45; }
        .buddies-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .buddy-card { position: relative; padding: 20px; min-height: 255px; }
        .compat { position: absolute; top: 16px; right: 18px; background: #effff5; color: #43c181; font-size: 13px; font-weight: 800; padding: 5px 11px; border-radius: 999px; }
        .buddy-head { display: flex; align-items: center; gap: 13px; margin-bottom: 24px; padding-right: 84px; }
        .buddy-head-link { width: 100%; background: transparent; border: 0; text-align: left; cursor: pointer; padding: 0; appearance: none; }
        .avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #8b4d73, #4f94bd); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; }
        .buddy-head h3 { margin: 0 0 2px; font-size: 20px; font-weight: 800; color: #071238; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .buddy-head p { margin: 0; font-size: 13px; color: #607399; overflow-wrap: anywhere; }
        .buddy-head > div:last-child { min-width: 0; flex: 1; }
        .quote { min-height: 54px; margin: 0 0 16px; color: #26395d; font-size: 14px; font-style: italic; line-height: 1.55; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
        .chips span { display: inline-flex; align-items: center; padding: 6px 11px; border-radius: 999px; background: #f3eef6; color: #43516b; font-size: 12px; line-height: 1; }
        .buddy-cta-btn { width: 100%; height: 42px; border: 0; border-radius: 10px; background: #7e3d5e; color: #fff; font-weight: 800; cursor: pointer; }
        .buddy-cta-btn:disabled { opacity: 0.72; cursor: default; }
        .results-empty-inline {
          margin: 0;
          color: var(--texte-gris);
          font-size: 14px;
        }
        .results-footer { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
        .section-actions { display: flex; justify-content: center; gap: 16px; margin-top: 76px; }
        @media (min-width: 900px) {
          .big-five-grid {
            grid-template-columns: 1fr 1.1fr;
            align-items: stretch;
          }
        }
        @media (max-width: 850px) {
          .function-grid, .buddies-grid { grid-template-columns: 1fr; }
          .section-actions { margin-top: 34px; flex-direction: column; }
          .section-actions .btn { width: 100%; }
        }
      `}</style>
    </main>
    </AppLayout>
  );
}

async function loadBuddyRelationships(userId: string, buddyIds: string[]): Promise<Record<string, BuddyRelationship>> {
  if (buddyIds.length === 0) return {};
  const supabase = getSupabaseClient();
  const [requestsRes, conversationsRes] = await Promise.all([
    supabase
      .from("buddy_requests")
      .select("sender_id,receiver_id,status")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .in("status", ["pending", "accepted"])
      .returns<BuddyRequestRow[]>(),
    supabase
      .from("conversations")
      .select("id,user_1_id,user_2_id")
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .returns<ConversationRow[]>(),
  ]);
  if (requestsRes.error) throw new Error(requestsRes.error.message);
  if (conversationsRes.error) throw new Error(conversationsRes.error.message);

  const buddySet = new Set(buddyIds);
  const relationships: Record<string, BuddyRelationship> = {};
  for (const buddyId of buddyIds) relationships[buddyId] = { status: "none", conversationId: null };

  for (const row of requestsRes.data ?? []) {
    const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    if (!buddySet.has(otherId)) continue;
    if (row.status === "accepted") relationships[otherId].status = "accepted";
    if (row.status === "pending" && relationships[otherId].status !== "accepted") {
      relationships[otherId].status = row.sender_id === userId ? "pending_sent" : "pending_received";
    }
  }

  for (const row of conversationsRes.data ?? []) {
    const otherId = row.user_1_id === userId ? row.user_2_id : row.user_1_id;
    if (!otherId || !buddySet.has(otherId)) continue;
    relationships[otherId].conversationId = row.id;
    if (relationships[otherId].status === "none") relationships[otherId].status = "accepted";
  }

  return relationships;
}

