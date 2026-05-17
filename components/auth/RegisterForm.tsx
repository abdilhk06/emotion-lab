"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { STUDY_LEVEL_CHOICES, isStudyLevel } from "@/lib/study-levels";
import { clearLegacyTestFlowStorage, clearUserTestFlowStorage } from "@/lib/test-flow-storage";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const nextEmail = email.trim().toLowerCase();
    const nextPseudo = pseudo.trim();
    if (!nextEmail || !nextPseudo || !studyLevel || !password || !confirmPassword) return setError("Merci de remplir tous les champs obligatoires.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) return setError("Merci d'entrer une adresse email valide.");
    if (!isStudyLevel(studyLevel)) return setError("Merci de choisir un niveau d'etude valide.");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caracteres.");
    if (password !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");
    setSubmitting(true);
    try {
      clearLegacyTestFlowStorage();
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: nextEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            pseudo: nextPseudo,
            study_level: studyLevel,
          },
        },
      });
      if (error) {
        setError(`Creation du compte impossible : ${error.message}`);
        return;
      }
      if (!data.user) {
        setError("Creation du compte impossible : Supabase n'a pas retourne d'utilisateur.");
        return;
      }
      if (data.user.identities?.length === 0) {
        setError("Un compte existe deja avec cet email. Connecte-toi depuis la page de connexion.");
        return;
      }

      clearUserTestFlowStorage(data.user.id);

      if (data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: nextEmail,
            pseudo: nextPseudo,
            study_level: studyLevel,
          },
          { onConflict: "id" }
        );

        if (profileError) {
          setError(`Profil non cree : ${profileError.message}`);
          return;
        }
      }

      void consent;
      router.push("/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue. Merci de reessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="auth-form-header"><h1>Inscription</h1><p>Cree ton compte pour demarrer ton parcours Emotion Lab.</p></div>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="input-group"><label htmlFor="register-email">Email</label><input id="register-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="input-group"><label htmlFor="register-pseudo">Pseudo</label><input id="register-pseudo" type="text" required value={pseudo} onChange={(e) => setPseudo(e.target.value)} /></div>
        <div className="input-group">
          <label htmlFor="register-study-level">Niveau d&apos;etude</label>
          <select id="register-study-level" required value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)}>
            <option value="">Choisir un niveau</option>
            {STUDY_LEVEL_CHOICES.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="register-password">Mot de passe</label>
          <div style={{ position: "relative" }}>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <div className="input-group">
          <label htmlFor="register-confirm-password">Confirmer le mot de passe</label>
          <div style={{ position: "relative" }}>
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: "104px" }}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
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
              {showConfirmPassword ? "Masquer" : "Afficher"}
            </button>
          </div>
        </div>
        <label className="checkbox-row" style={{ marginBottom: 14 }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>J&apos;accepte de recevoir des communications utiles (optionnel).</span></label>
        {error ? <p style={{ color: "#b42318", fontSize: 14, marginBottom: 12 }}>{error}</p> : null}
        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={submitting}>{submitting ? "Creation du compte..." : "Creer mon compte"}</button>
        <div className="auth-extra">Deja inscrit·e ? <Link href="/login">Me connecter</Link></div>
      </form>
    </>
  );
}
