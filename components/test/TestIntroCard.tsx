'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TestIntroCard() {
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const router = useRouter();

  return (
    <section className="test-intro-card" aria-labelledby="test-intro-title">
      <div className="test-intro-brand">
        <span aria-label="Emotion Lab" className="brand-logo test-intro-brand-logo" role="img" />
      </div>

      <h1 id="test-intro-title" className="test-intro-title">
        Avant de commencer
      </h1>
      <p className="test-intro-summary">50 questions - environ 12 minutes</p>
      <p className="test-intro-badge">Test scientifique valide</p>

      <div className="test-intro-disclaimer">
        <strong>Important</strong>
        <p>
          Ce test est un outil de <strong>reflexion personnelle</strong>. Il ne constitue ni un
          diagnostic medical, ni une evaluation psychologique. Reponds spontanement, il n&apos;y a
          pas de bonne ou mauvaise reponse.
        </p>
        <p>
          Tes resultats sont <strong>chiffres</strong> et <strong>prives</strong>. Tu peux les
          supprimer a tout moment.
        </p>
      </div>

      <label className="checkbox-row test-intro-consent" htmlFor="test-consent">
        <input
          id="test-consent"
          type="checkbox"
          checked={isConsentChecked}
          onChange={(event) => setIsConsentChecked(event.target.checked)}
        />
        <span>J&apos;ai lu et compris</span>
      </label>

      <button
        type="button"
        className="btn btn-primary btn-lg test-intro-cta"
        disabled={!isConsentChecked}
        onClick={() => router.push("/test")}
      >
        Commencer le test
      </button>

      <Link href="/" className="test-intro-later-link">
        Je reprendrai plus tard
      </Link>
    </section>
  );
}
