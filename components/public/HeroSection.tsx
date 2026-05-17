import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div>
          <span className="hero-eyebrow">Pensé par des étudiant·es, pour les étudiant·es de l&apos;ISCAE</span>
          <h1>Ton espace <span className="accent">bienveillant</span> pour mieux te connaître et avancer ensemble</h1>
          <p className="hero-subtitle">Un test de personnalité, un chatbot pour les coups de mou, et un·e Buddy qui te ressemble. Anonyme, gratuit, et fait pour toi.</p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" href="/login">Commencer maintenant</Link>
            <span className="subtext">Déjà un compte ? <Link href="/login" style={{ color: "var(--bleu-ciel)", textDecoration: "none", fontWeight: 500 }}>Me connecter</Link></span>
          </div>
        </div>
        <div className="hero-illustration"><div className="hero-blob" /><BrandLogo variant="hero" className="hero-brand-logo" priority /></div>
      </div>
    </section>
  );
}

