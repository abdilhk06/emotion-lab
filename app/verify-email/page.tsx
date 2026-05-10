import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <main className="verify-wrap">
      <section className="verify-card">
        <h1>Validation email</h1>
        <p>Verifie ta boite mail pour confirmer ton inscription avant de te connecter.</p>
        <div className="verify-actions">
          <Link className="btn btn-primary btn-lg" href="/login">Aller au login</Link>
          <Link className="btn btn-tertiary btn-lg" href="/">Retour a l&apos;accueil</Link>
        </div>
      </section>
    </main>
  );
}
