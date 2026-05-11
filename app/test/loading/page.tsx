import Link from "next/link";

export default function TestLoadingPage() {
  return (
    <main className="test-page loading-page">
      <div className="test-shell loading-shell">
        <section className="loading-card" aria-labelledby="loading-title">
          <h1 id="loading-title">Analyse en cours...</h1>
          <p>Nous preparons ton profil emotionnel et tes recommandations de Buddies.</p>
          <div className="loading-bar" aria-hidden="true">
            <div className="fill" />
          </div>
          <Link href="/" className="test-intro-later-link">
            Retour a l&apos;accueil
          </Link>
        </section>
      </div>
    </main>
  );
}
