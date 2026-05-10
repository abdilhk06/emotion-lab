"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email || !pseudo || !studyLevel || !password || !confirmPassword) return setError("Merci de remplir tous les champs obligatoires.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Merci d'entrer une adresse email valide.");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caracteres.");
    if (password !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");
    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            pseudo,
            study_level: studyLevel,
          },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      void consent;
      router.push("/verify-email");
    } catch {
      setError("Une erreur inattendue est survenue. Merci de reessayer.");
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
        <div className="input-group"><label htmlFor="register-study-level">Niveau d&apos;etude</label><input id="register-study-level" type="text" required value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} /></div>
        <div className="input-group"><label htmlFor="register-password">Mot de passe</label><input id="register-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="input-group"><label htmlFor="register-confirm-password">Confirmer le mot de passe</label><input id="register-confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
        <label className="checkbox-row" style={{ marginBottom: 14 }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>J&apos;accepte de recevoir des communications utiles (optionnel).</span></label>
        {error ? <p style={{ color: "#b42318", fontSize: 14, marginBottom: 12 }}>{error}</p> : null}
        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={submitting}>{submitting ? "Creation du compte..." : "Creer mon compte"}</button>
        <div className="auth-extra">Deja inscrit·e ? <Link href="/login">Me connecter</Link></div>
      </form>
    </>
  );
}
