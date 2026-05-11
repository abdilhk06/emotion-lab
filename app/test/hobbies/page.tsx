'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HobbiesCounter } from "@/components/test/HobbiesCounter";
import { HobbyCategory } from "@/components/test/HobbyCategory";
import { TestHeader } from "@/components/test/TestHeader";
import { ValidateHobbiesButton } from "@/components/test/ValidateHobbiesButton";
import { HOBBY_CATEGORIES, MAX_HOBBIES, MIN_HOBBIES } from "@/lib/data/hobbies";

const HOBBIES_STORAGE_KEY = "emotionlab_test_hobbies";

function readStoredHobbies(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(HOBBIES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    localStorage.removeItem(HOBBIES_STORAGE_KEY);
    return [];
  }
}

export default function TestHobbiesPage() {
  const router = useRouter();
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(readStoredHobbies);

  useEffect(() => {
    localStorage.setItem(HOBBIES_STORAGE_KEY, JSON.stringify(selectedHobbies));
  }, [selectedHobbies]);

  const selectedSet = useMemo(() => new Set(selectedHobbies), [selectedHobbies]);
  const selectedCount = selectedHobbies.length;
  const maxReached = selectedCount >= MAX_HOBBIES;
  const canSubmit = selectedCount >= MIN_HOBBIES && selectedCount <= MAX_HOBBIES;

  const handleToggleHobby = (hobby: string) => {
    setSelectedHobbies((previous) => {
      if (previous.includes(hobby)) {
        return previous.filter((item) => item !== hobby);
      }
      if (previous.length >= MAX_HOBBIES) {
        return previous;
      }
      return [...previous, hobby];
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    localStorage.setItem(HOBBIES_STORAGE_KEY, JSON.stringify(selectedHobbies));
    router.push("/test/loading");
  };

  return (
    <main className="test-page hobbies-page">
      <div className="test-shell hobbies-shell">
        <TestHeader progressText="Derniers ajustements" backHref="/test" />

        <section className="test-section-head hobbies-head" aria-labelledby="hobbies-title">
          <h1 id="hobbies-title">Dis-nous ce que tu aimes</h1>
          <p>
            Selectionne entre {MIN_HOBBIES} et {MAX_HOBBIES} loisirs. Ca nous aide a te trouver des Buddies qui te
            ressemblent.
          </p>
        </section>

        <HobbiesCounter selectedCount={selectedCount} min={MIN_HOBBIES} max={MAX_HOBBIES} />

        <p className="hobbies-helper-text" role="status" aria-live="polite">
          {maxReached
            ? `Tu as atteint la limite de ${MAX_HOBBIES} loisirs. Deselectionne un loisir pour en choisir un autre.`
            : `Tu peux encore selectionner ${MAX_HOBBIES - selectedCount} loisir${MAX_HOBBIES - selectedCount > 1 ? "s" : ""}.`}
        </p>

        <div className="hobbies-list" aria-label="Categories de loisirs">
          {HOBBY_CATEGORIES.map((category) => (
            <HobbyCategory
              key={category.id}
              name={category.name}
              hobbies={category.hobbies}
              selected={selectedSet}
              maxReached={maxReached}
              onToggle={handleToggleHobby}
            />
          ))}
        </div>

        <ValidateHobbiesButton canSubmit={canSubmit} onSubmit={handleSubmit} />

        <div className="hobbies-skip-wrap">
          <Link href="/test/loading" className="hobbies-skip-link">
            Passer et completer plus tard
          </Link>
        </div>
      </div>
    </main>
  );
}
