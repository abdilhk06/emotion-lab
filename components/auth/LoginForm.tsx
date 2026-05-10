"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 700);
  };

  return (
    <>
      <div className="auth-form-header">
        <h1>Bon retour</h1>
        <p>Connecte-toi pour retrouver ton espace.</p>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        <div className="input-group">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" placeholder="ton.nom@email.com" required type="email" />
        </div>

        <div className="input-group">
          <label htmlFor="login-pwd">Mot de passe</label>
          <input id="login-pwd" placeholder="Ton mot de passe" required type="password" />
        </div>

        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}
        >
          <label className="checkbox-row" style={{ margin: 0 }}>
            <input type="checkbox" />
            <span>Se souvenir de moi</span>
          </label>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ color: "var(--bleu-ciel)", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}
          >
            Mot de passe oublie ?
          </a>
        </div>

        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: "6px" }} type="submit">
          {submitting ? "Connexion..." : "Me connecter"}
        </button>

        <div className="auth-extra">
          Pas encore inscrit·e ? <Link href="#">Creer un compte</Link>
        </div>
      </form>
    </>
  );
}
