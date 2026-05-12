'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateResult, type AnswerValue, type CalculatedResult } from "@/lib/calculate-result";
import { getSupabaseClient } from "@/lib/supabase/client";
import { clearLegacyTestFlowStorage, getUserTestFlowStorageKey } from "@/lib/test-flow-storage";

type AnswersState = Record<string, AnswerValue>;
type PersistState = "loading" | "error";

function readAnswers(userId: string): AnswersState | null {
  if (typeof window === "undefined") return null;
  const storageKey = getUserTestFlowStorageKey(userId, "answers");
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as AnswersState;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

function readHobbies(userId: string): string[] {
  if (typeof window === "undefined") return [];
  const storageKey = getUserTestFlowStorageKey(userId, "hobbies");
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
}

function getCountedAnswers(answers: AnswersState): number {
  return Object.values(answers).filter((value) => {
    if (typeof value === "number") return true;
    if (typeof value === "string") return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  }).length;
}

export default function TestLoadingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PersistState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const loadingText = useMemo(() => {
    const variants = [
      "Analyse de tes reponses...",
      "On finalise ton profil personnalise...",
      "Encore quelques secondes...",
    ];
    return variants[retryToken % variants.length];
  }, [retryToken]);

  const runFlow = useCallback(async () => {
    setStatus("loading");
    setError(null);
    clearLegacyTestFlowStorage();

    let userId: string | null = null;

    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setStatus("error");
        setError(`Impossible de verifier ton compte: ${userError.message}`);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      userId = user.id;
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Impossible de verifier ton compte.");
      return;
    }

    const answers = readAnswers(userId);
    if (!answers || getCountedAnswers(answers) === 0) {
      setStatus("error");
      setError("Tes reponses sont introuvables. Relance le test pour continuer.");
      return;
    }

    const selectedHobbies = readHobbies(userId);
    const result: CalculatedResult = calculateResult(answers);
    const fallbackPayload = {
      ...result,
      selected_hobbies: selectedHobbies,
      calculated_at: new Date().toISOString(),
    };

    localStorage.setItem(getUserTestFlowStorageKey(userId, "result"), JSON.stringify(fallbackPayload));

    let saveError: string | null = null;

    try {
      const supabase = getSupabaseClient();
      const { error: resultError } = await supabase.from("test_results").insert({
        user_id: userId,
        ...result,
      });

      if (resultError) {
        saveError = `test_results insert: ${resultError.message}`;
      }

      if (!saveError && selectedHobbies.length > 0) {
        const hobbyRows = selectedHobbies.map((hobby) => ({
          user_id: userId,
          hobby,
        }));

        const { error: hobbiesError } = await supabase.from("user_hobbies").upsert(hobbyRows, {
          onConflict: "user_id,hobby",
          ignoreDuplicates: true,
        });

        if (hobbiesError) {
          saveError = `user_hobbies upsert: ${hobbiesError.message}`;
        }
      }
    } catch (caught) {
      saveError = caught instanceof Error ? caught.message : "Impossible de sauvegarder tes resultats.";
    }

    if (saveError) {
      setStatus("error");
      setError(`La sauvegarde a echoue: ${saveError}`);
      return;
    }

    window.setTimeout(() => {
      router.replace("/test/results");
    }, 2500);
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void runFlow();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [runFlow, retryToken]);

  if (status === "error") {
    return (
      <main className="test-page loading-page">
        <div className="test-shell loading-shell">
          <section className="loading-card" aria-labelledby="loading-error-title">
            <h1 id="loading-error-title">Oups, on bloque ici</h1>
            <p>{error ?? "Une erreur est survenue pendant le calcul de ton profil."}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn btn-primary" type="button" onClick={() => setRetryToken((value) => value + 1)}>
                Reessayer
              </button>
              <Link href="/test" className="test-intro-later-link">
                Revenir au test
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="test-page loading-page">
      <div className="test-shell loading-shell">
        <section className="loading-card" aria-labelledby="loading-title">
          <span aria-label="Emotion Lab" className="brand-logo loading-brain-img" role="img" />
          <h1 id="loading-title">{loadingText}</h1>
          <p>On prepare ton profil personnalise. Tu vas decouvrir tes premiers resultats dans un instant.</p>
          <p className="loading-subtext">Respire, on fait les derniers calculs pour toi.</p>
          <div className="loading-bar-wrap" aria-hidden="true">
            <div className="loading-bar">
              <div className="fill loading-fill" />
            </div>
          </div>
        </section>
      </div>
      <style jsx>{`
        .loading-page {
          background:
            radial-gradient(800px 360px at 10% -12%, rgba(247, 186, 193, 0.34), transparent 64%),
            radial-gradient(780px 340px at 88% -16%, rgba(142, 192, 201, 0.3), transparent 64%),
            var(--fond-creme);
        }

        .loading-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding-top: 0;
          padding-bottom: 28px;
        }

        .loading-card {
          width: min(100%, 620px);
          border-radius: 22px;
          padding: 30px 24px 24px;
          box-shadow: 0 22px 50px rgba(48, 36, 55, 0.1);
        }

        .loading-brain-img {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          margin-bottom: 14px;
          box-shadow: 0 10px 24px rgba(126, 61, 94, 0.22);
          animation: pulse 1.6s ease-in-out infinite;
        }

        .loading-subtext {
          margin-top: -3px;
          margin-bottom: 16px;
          font-size: 14px;
          color: var(--texte-clair);
        }

        .loading-bar-wrap {
          margin-top: 8px;
        }

        .loading-fill {
          width: 35%;
          animation: progress 2.2s ease-in-out infinite;
        }

        @keyframes progress {
          0% {
            width: 18%;
            transform: translateX(0);
          }
          50% {
            width: 72%;
            transform: translateX(10%);
          }
          100% {
            width: 28%;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @media (max-width: 640px) {
          .loading-card {
            border-radius: 18px;
            padding: 24px 16px 18px;
          }
        }
      `}</style>
    </main>
  );
}
