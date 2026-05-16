"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { BuddyCard } from "@/components/buddies/BuddyCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { computeBuddyCompatibilityScore } from "@/lib/compatibility";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  bio: string | null;
  study_level: string | null;
  is_visible: boolean | null;
};

type ResultRow = {
  user_id: string;
  mbti_code: string | null;
  created_at: string;
};

type HobbyRow = {
  user_id: string;
  hobby: string;
};

type BuddyRequestStatus = "none" | "pending" | "accepted" | "rejected";

type BuddyRequestRow = {
  sender_id: string;
  receiver_id: string;
  status: Exclude<BuddyRequestStatus, "none"> | "cancelled";
  created_at: string;
};

type BuddyItem = {
  id: string;
  pseudo: string;
  bio: string;
  studyLevel: string;
  mbti: string;
  sharedHobbies: string[];
  compatibility: number;
  requestStatus: BuddyRequestStatus;
};

type DirectoryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; buddies: BuddyItem[]; allHobbies: string[]; studyLevels: string[] };

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function BuddyDirectoryPage() {
  const router = useRouter();
  const [state, setState] = useState<DirectoryState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
  const [highCompatibilityOnly, setHighCompatibilityOnly] = useState(false);

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

        const [profilesRes, myProfileRes, resultsRes, hobbiesRes, requestsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, pseudo, bio, study_level, is_visible")
            .eq("is_visible", true)
            .returns<ProfileRow[]>(),
          supabase
            .from("profiles")
            .select("id, pseudo, bio, study_level, is_visible")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>(),
          supabase
            .from("test_results")
            .select("user_id, mbti_code, created_at")
            .order("created_at", { ascending: false })
            .returns<ResultRow[]>(),
          supabase.from("user_hobbies").select("user_id, hobby").returns<HobbyRow[]>(),
          supabase
            .from("buddy_requests")
            .select("sender_id, receiver_id, status, created_at")
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .returns<BuddyRequestRow[]>(),
        ]);

        const firstError = profilesRes.error ?? myProfileRes.error ?? resultsRes.error ?? hobbiesRes.error ?? requestsRes.error;
        if (firstError) {
          setState({ status: "error", message: firstError.message });
          return;
        }

        const visibleProfiles = (profilesRes.data ?? []).filter((profile) => profile.id !== user.id);
        const latestResultByUser = new Map<string, string | null>();
        for (const row of resultsRes.data ?? []) {
          if (!latestResultByUser.has(row.user_id)) {
            latestResultByUser.set(row.user_id, row.mbti_code);
          }
        }

        const hobbiesByUser = new Map<string, Set<string>>();
        for (const row of hobbiesRes.data ?? []) {
          const entry = hobbiesByUser.get(row.user_id) ?? new Set<string>();
          entry.add(row.hobby);
          hobbiesByUser.set(row.user_id, entry);
        }

        const myHobbies = hobbiesByUser.get(user.id) ?? new Set<string>();
        const myMbti = latestResultByUser.get(user.id) ?? null;
        const myStudyLevel = myProfileRes.data?.study_level ?? null;

        const requestStatusByBuddy = new Map<string, BuddyRequestStatus>();
        const statusRank: Record<BuddyRequestStatus, number> = {
          none: 0,
          rejected: 1,
          pending: 2,
          accepted: 3,
        };
        for (const row of requestsRes.data ?? []) {
          if (row.status === "cancelled") continue;
          const buddyId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
          const nextStatus = row.status;
          const currentStatus = requestStatusByBuddy.get(buddyId) ?? "none";
          if (statusRank[nextStatus] > statusRank[currentStatus]) {
            requestStatusByBuddy.set(buddyId, nextStatus);
          }
        }

        const buddies = visibleProfiles.map((profile) => {
          const hobbies = Array.from(hobbiesByUser.get(profile.id) ?? []);
          const sharedHobbies = hobbies.filter((hobby) => myHobbies.has(hobby));
          const compatibility = computeBuddyCompatibilityScore({
            sharedHobbiesCount: sharedHobbies.length,
            currentMbti: myMbti,
            buddyMbti: latestResultByUser.get(profile.id) ?? null,
            sameStudyLevel: Boolean(myStudyLevel && profile.study_level && myStudyLevel === profile.study_level),
          });

          return {
            id: profile.id,
            pseudo: profile.pseudo?.trim() || "@buddy",
            bio: profile.bio?.trim() || "Toujours partant·e pour reviser, rire et partager de nouvelles passions.",
            studyLevel: profile.study_level?.trim() || "Niveau non precise",
            mbti: latestResultByUser.get(profile.id) ?? "MBTI",
            sharedHobbies,
            compatibility,
            requestStatus: requestStatusByBuddy.get(profile.id) ?? "none",
          };
        });

        buddies.sort((a, b) => b.compatibility - a.compatibility || a.pseudo.localeCompare(b.pseudo, "fr"));

        const allHobbies = Array.from(
          new Set(
            buddies
              .flatMap((buddy) => buddy.sharedHobbies)
              .filter((hobby) => hobby.length > 0)
              .sort((a, b) => a.localeCompare(b, "fr"))
          )
        );
        const studyLevels = Array.from(new Set(buddies.map((buddy) => buddy.studyLevel))).sort((a, b) => a.localeCompare(b, "fr"));

        setState({ status: "ready", buddies, allHobbies, studyLevels });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger l'annuaire buddy.",
        });
      }
    };

    void run();
  }, [router]);

  const filteredBuddies = useMemo(() => {
    if (state.status !== "ready") return [];

    const search = normalizeText(query);
    return state.buddies.filter((buddy) => {
      const searchable = `${buddy.pseudo} ${buddy.bio} ${buddy.studyLevel}`;
      const textMatch = search.length === 0 || normalizeText(searchable).includes(search);
      const levelMatch = !selectedLevel || buddy.studyLevel === selectedLevel;
      const hobbyMatch = !selectedHobby || buddy.sharedHobbies.includes(selectedHobby);
      const compatibilityMatch = !highCompatibilityOnly || buddy.compatibility >= 80;
      return textMatch && levelMatch && hobbyMatch && compatibilityMatch;
    });
  }, [highCompatibilityOnly, query, selectedHobby, selectedLevel, state]);

  return (
    <AppLayout title="Annuaire Buddy">
      {state.status === "loading" ? (
        <section className="buddy-state-card" role="status" aria-live="polite">
          <h2>Chargement des buddies...</h2>
          <p>On cherche les profils visibles compatibles avec toi.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="buddy-state-card buddy-state-error" role="alert">
          <h2>Impossible de charger l&apos;annuaire</h2>
          <p>{state.message}</p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <div className="buddy-directory">
          <div className="buddy-page-title">
            <h1>Annuaire Buddy</h1>
            <p>{filteredBuddies.length} étudiant·es actuellement actifs · triés par compatibilité avec ton profil</p>
          </div>
          <SearchBar value={query} onChange={setQuery} placeholder="Rechercher par pseudo..." ariaLabel="Rechercher par pseudo" />

          <div className="buddy-filters">
            <button type="button" className={`filter-chip ${highCompatibilityOnly ? "active" : ""}`} onClick={() => setHighCompatibilityOnly((prev) => !prev)}>
              Compatibilité élevée{highCompatibilityOnly ? " ×" : ""}
            </button>
            {state.studyLevels.map((level) => (
              <button
                key={level}
                type="button"
                className={`filter-chip ${selectedLevel === level ? "active" : ""}`}
                onClick={() => setSelectedLevel((prev) => (prev === level ? null : level))}
              >
                {level}{selectedLevel === level ? " ×" : ""}
              </button>
            ))}
            {state.allHobbies.map((hobby) => (
              <button
                key={hobby}
                type="button"
                className={`filter-chip ${selectedHobby === hobby ? "active" : ""}`}
                onClick={() => setSelectedHobby((prev) => (prev === hobby ? null : hobby))}
              >
                {hobby}{selectedHobby === hobby ? " ×" : ""}
              </button>
            ))}
          </div>

          {filteredBuddies.length === 0 ? (
            <section className="buddy-state-card" role="status">
              <h2>Aucun buddy ne correspond a ta recherche</h2>
              <p>Essaie de retirer un filtre ou de modifier ta recherche.</p>
            </section>
          ) : (
            <div className="buddy-dir-grid">
              {filteredBuddies.map((buddy) => (
                <BuddyCard
                  key={buddy.id}
                  id={buddy.id}
                  pseudo={buddy.pseudo}
                  studyLevel={buddy.studyLevel}
                  mbti={buddy.mbti}
                  bio={buddy.bio}
                  sharedHobbies={buddy.sharedHobbies}
                  compatibility={buddy.compatibility}
                  requestStatus={buddy.requestStatus}
                />
              ))}
            </div>
          )}
          <div className="buddy-load-wrap">
            <button type="button" className="btn-load-more">Charger plus de Buddies</button>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .buddy-directory {
          display: grid;
          gap: 14px;
        }
        .buddy-head p {
          margin: 0;
          color: var(--texte-gris);
          font-size: 14px;
        }
        .buddy-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--bordure);
          background: #fff;
        }
        .buddy-search svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: var(--texte-clair);
          stroke-width: 2;
        }
        .buddy-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
          color: var(--texte);
        }
        .buddy-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-chip {
          border: 1px solid var(--bordure);
          background: #fff;
          color: var(--texte-gris);
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        .filter-chip.active {
          border-color: var(--plum);
          color: var(--plum);
          background: #f8eef5;
          font-weight: 600;
        }
        .buddy-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        :global(.buddy-card) {
          position: relative;
          display: grid;
          gap: 12px;
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 14px;
        }
        :global(.buddy-compat) {
          position: absolute;
          top: 12px;
          right: 12px;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 700;
        }
        :global(.buddy-compat.high) {
          color: #0e9f6e;
          background: #ebfff5;
        }
        :global(.buddy-compat.mid) {
          color: #d97706;
          background: #fff7e9;
        }
        :global(.buddy-compat.low) {
          color: #6b7280;
          background: #f3f4f6;
        }
        :global(.buddy-top) {
          display: flex;
          gap: 10px;
          align-items: center;
          padding-right: 46px;
        }
        :global(.buddy-avatar) {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--gradient-signature);
          color: #fff;
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        :global(.buddy-top h3) {
          margin: 0;
          font-size: 16px;
        }
        :global(.buddy-top p) {
          margin: 2px 0 0;
          color: var(--texte-clair);
          font-size: 13px;
        }
        :global(.buddy-bio) {
          margin: 0;
          color: var(--texte-gris);
          font-size: 14px;
          min-height: 66px;
        }
        :global(.buddy-hobbies) {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        :global(.buddy-chip) {
          border-radius: 999px;
          padding: 5px 10px;
          background: #f7f2fb;
          color: var(--plum);
          font-size: 12px;
          border: 1px solid #e9deef;
        }
        :global(.buddy-chip-muted) {
          color: var(--texte-clair);
          background: #f8fafc;
          border-color: #e5e7eb;
        }
        .buddy-state-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
        }
        .buddy-state-card h2 {
          margin: 0 0 6px;
        }
        .buddy-state-card p {
          margin: 0;
          color: var(--texte-gris);
        }
        .buddy-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }
        @media (max-width: 1099px) {
          .buddy-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 699px) {
          .buddy-grid {
            grid-template-columns: 1fr;
          }
          :global(.buddy-card .btn) {
            width: 100%;
          }
        }
        .buddy-directory {
          gap: 16px;
        }
        .buddy-page-title h1 {
          margin: 0 0 6px;
          color: #7e3d5e;
          font-size: 32px;
        }
        .buddy-page-title p {
          margin: 0;
          color: var(--texte-gris);
          font-size: 15px;
        }
        :global(.buddy-search) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e4dcea;
          background: #fff;
        }
        :global(.buddy-search svg) {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: var(--texte-clair);
          stroke-width: 2;
        }
        :global(.buddy-search input) {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
          color: var(--texte);
        }
        .filter-chip {
          border-radius: 999px;
          padding: 6px 14px;
          border: 1px solid #e4dcea;
          cursor: pointer;
          font-size: 14px;
          background: #fff;
          color: var(--texte-gris);
        }
        .filter-chip.active {
          background: #7e3d5e;
          color: #fff;
          border-color: #7e3d5e;
        }
        .buddy-load-wrap {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }
        .btn-load-more {
          border: 1px solid #8a3b65;
          color: #8a3b65;
          background: #fff;
          border-radius: 10px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
        }
        :global(.buddy-dir-grid) {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        :global(.buddy-dir-card) {
          position: relative;
          background: #fff;
          border: 1px solid #e4dcea;
          border-radius: 16px;
          padding: 20px;
          display: grid;
          gap: 12px;
        }
        :global(.compat-badge) {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #ebfff0;
          color: #35ba72;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 13px;
          font-weight: 700;
        }
        :global(.card-header) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-right: 66px;
        }
        :global(.avatar) {
          width: 50px;
          height: 50px;
          border-radius: 999px;
          background: linear-gradient(135deg, #9d4b7a, #2f91bd);
          color: #fff;
          font-weight: 700;
          font-size: 19px;
          display: grid;
          place-items: center;
        }
        :global(.card-header h3) {
          margin: 0;
          font-size: 16px;
        }
        :global(.meta) {
          color: #66738e;
          font-size: 13px;
        }
        :global(.tagline) {
          margin: 0;
          color: #26365a;
          font-style: italic;
        }
        :global(.chips) {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        :global(.chip) {
          border-radius: 999px;
          padding: 6px 10px;
          background: #f7f2fb;
          color: var(--plum);
          font-size: 13px;
          border: 1px solid #e9deef;
        }
        :global(.btn-send) {
          width: 100%;
          padding: 13px;
          background: #8a3b65;
          color: #fff;
          border: 0;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        @media (max-width: 700px) {
          :global(.buddy-dir-grid) {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppLayout>
  );
}
