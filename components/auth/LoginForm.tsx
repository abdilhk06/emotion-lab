"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { clearLegacyTestFlowStorage } from "@/lib/test-flow-storage";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Merci de renseigner ton email et ton mot de passe.");
      return;
    }

    setSubmitting(true);

    try {
      clearLegacyTestFlowStorage();
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Une erreur inattendue est survenue. Merci de reessayer.");
    } finally {
      setSubmitting(false);
    }
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
          <input
            id="login-email"
            placeholder="ton.nom@email.com"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="login-pwd">Mot de passe</label>
          <div style={{ position: "relative" }}>
            <input
              id="login-pwd"
              placeholder="Ton mot de passe"
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ paddingRight: "104px" }}
            />
            <button
              type="button"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "var(--bleu-ciel)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {showPassword ? "Masquer" : "Afficher"}
            </button>
          </div>
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
            onClick={(event) => event.preventDefault()}
            style={{ color: "var(--bleu-ciel)", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}
          >
            Mot de passe oublie ?
          </a>
        </div>

        {error ? <p style={{ color: "#b42318", fontSize: 14, marginBottom: 12 }}>{error}</p> : null}

        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: "6px" }} type="submit" disabled={submitting}>
          {submitting ? "Connexion..." : "Me connecter"}
        </button>

        <div className="auth-extra">
          Pas encore inscrit·e ? <Link href="/register">Creer un compte</Link>
        </div>
      </form>
    </>
  );
}
