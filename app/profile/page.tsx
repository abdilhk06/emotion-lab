"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  study_level: string | null;
  bio: string | null;
  looking_for: string | null;
  is_visible: boolean | null;
};

type HobbyRow = {
  hobby: string;
};

type ResultRow = {
  mbti_code: string | null;
  mbti_name: string | null;
  created_at: string;
};

type FormValues = {
  pseudo: string;
  studyLevel: string;
  bio: string;
  lookingFor: string;
  isVisible: boolean;
  hobbies: string[];
};

type ProfileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; message: string }
  | { status: "ready" };

const BIO_MAX = 200;
const LOOKING_FOR_MAX = 100;
const HOBBIES_MAX = 15;

const EMPTY_FORM: FormValues = {
  pseudo: "",
  studyLevel: "",
  bio: "",
  lookingFor: "",
  isVisible: true,
  hobbies: [],
};

function normalizeHobby(hobby: string): string {
  return hobby.trim().replace(/\s+/g, " ");
}

const HOBBY_EMOJIS: Record<string, string> = {
  concerts: "🎤",
  "decouverte resto": "🍽️",
  "découverte resto": "🍽️",
  "developpement durable": "🌱",
  "développement durable": "🌱",
  "developpement personnel": "🌟",
  "développement personnel": "🌟",
  ecriture: "✍️",
  "écriture": "✍️",
  poesie: "✍️",
  "poésie": "✍️",
  football: "⚽",
  "jeux de societe": "🎲",
  "jeux de société": "🎲",
  "voyages en van": "🚐",
  running: "🏃",
  lecture: "📚",
  "lecture (romans)": "📚",
  cuisine: "🍳",
  tennis: "🎾",
  cafés: "☕",
  cinéma: "🎬",
};

function hobbyEmoji(hobby: string): string {
  return HOBBY_EMOJIS[normalizeHobby(hobby).toLowerCase()] ?? "✨";
}

function sortHobbies(hobbies: string[]): string[] {
  return [...hobbies].sort((a, b) => a.localeCompare(b, "fr"));
}

function displayPseudo(pseudo: string, email: string): string {
  const clean = pseudo.trim().replace(/^@+/, "");
  if (clean) return `@${clean}`;
  return email ? `@${email.split("@")[0]}` : "@profil";
}

function initialsFromIdentity(pseudo: string, email: string): string {
  const source = pseudo.trim().replace(/^@+/, "") || email.split("@")[0] || "EL";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [mbtiCode, setMbtiCode] = useState<string | null>(null);
  const [mbtiName, setMbtiName] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormValues>(EMPTY_FORM);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

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

        setUserId(user.id);
        setEmail(user.email ?? "");

        const [profileRes, hobbiesRes, resultRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, pseudo, study_level, bio, looking_for, is_visible")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>(),
          supabase.from("user_hobbies").select("hobby").eq("user_id", user.id).returns<HobbyRow[]>(),
          supabase
            .from("test_results")
            .select("mbti_code, mbti_name, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle<ResultRow>(),
        ]);

        const firstError = profileRes.error ?? hobbiesRes.error ?? resultRes.error;
        if (firstError) {
          setState({ status: "error", message: firstError.message });
          return;
        }

        if (!profileRes.data) {
          setState({
            status: "empty",
            message: "Profil introuvable pour ton compte. Reconnecte-toi puis reessaie.",
          });
          return;
        }

        const nextForm: FormValues = {
          pseudo: profileRes.data.pseudo?.trim() ?? "",
          studyLevel: profileRes.data.study_level?.trim() ?? "",
          bio: profileRes.data.bio?.trim() ?? "",
          lookingFor: profileRes.data.looking_for?.trim() ?? "",
          isVisible: profileRes.data.is_visible ?? true,
          hobbies: sortHobbies((hobbiesRes.data ?? []).map((item) => item.hobby).filter(Boolean)),
        };

        setMbtiCode(resultRes.data?.mbti_code ?? null);
        setMbtiName(resultRes.data?.mbti_name ?? null);
        setForm(nextForm);
        setInitialForm(nextForm);
        setState({ status: "ready" });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger ton profil pour le moment.",
        });
      }
    };

    void run();
  }, [router]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
  const initials = useMemo(() => initialsFromIdentity(form.pseudo, email), [email, form.pseudo]);
  const mbtiLabel = mbtiCode ? `${mbtiCode}${mbtiName ? ` · ${mbtiName}` : ""}` : "Profil MBTI a completer";
  const metaStudy = form.studyLevel || "Niveau d'etudes non renseigne";

  const validateForm = (values: FormValues): string | null => {
    if (!values.pseudo.trim()) return "Le pseudo est obligatoire.";
    if (values.pseudo.trim().length < 3) return "Le pseudo doit contenir au moins 3 caracteres.";
    if (!values.studyLevel.trim()) return "Le niveau d'etudes est obligatoire.";
    if (values.bio.length > BIO_MAX) return "La bio depasse la limite autorisee.";
    if (values.lookingFor.length > LOOKING_FOR_MAX) return "Le champ 'ce que tu cherches' depasse la limite.";
    if (values.hobbies.length > HOBBIES_MAX) return "Tu peux enregistrer jusqu'a 15 loisirs maximum.";
    return null;
  };

  const onAddHobby = () => {
    setFeedback(null);
    const normalized = normalizeHobby(hobbyDraft);
    if (!normalized) return;
    if (normalized.length < 2) {
      setFeedback({ tone: "error", message: "Le loisir doit contenir au moins 2 caracteres." });
      return;
    }
    if (form.hobbies.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setFeedback({ tone: "error", message: "Ce loisir est deja dans ta liste." });
      return;
    }
    if (form.hobbies.length >= HOBBIES_MAX) {
      setFeedback({ tone: "error", message: "Tu as atteint la limite de 15 loisirs." });
      return;
    }
    setForm((prev) => ({ ...prev, hobbies: sortHobbies([...prev.hobbies, normalized]) }));
    setHobbyDraft("");
  };

  const onHobbySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddHobby();
  };

  const onCancel = () => {
    setForm(initialForm);
    setHobbyDraft("");
    setFeedback(null);
  };

  const onSave = async () => {
    setFeedback(null);
    const error = validateForm(form);
    if (error) {
      setFeedback({ tone: "error", message: error });
      return;
    }
    if (!userId) {
      setFeedback({ tone: "error", message: "Session invalide. Reconnecte-toi puis reessaie." });
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const nextHobbies = sortHobbies(form.hobbies.map(normalizeHobby).filter(Boolean));
      const previousHobbies = initialForm.hobbies;
      const removed = previousHobbies.filter((hobby) => !nextHobbies.includes(hobby));
      const added = nextHobbies.filter((hobby) => !previousHobbies.includes(hobby));

      const updateRes = await supabase
        .from("profiles")
        .update({
          pseudo: form.pseudo.trim(),
          study_level: form.studyLevel.trim(),
          bio: form.bio.trim() || null,
          looking_for: form.lookingFor.trim() || null,
          is_visible: form.isVisible,
        })
        .eq("id", userId);

      if (updateRes.error) {
        setFeedback({ tone: "error", message: updateRes.error.message });
        return;
      }

      if (removed.length > 0) {
        const deleteRes = await supabase.from("user_hobbies").delete().eq("user_id", userId).in("hobby", removed);
        if (deleteRes.error) {
          setFeedback({ tone: "error", message: deleteRes.error.message });
          return;
        }
      }

      if (added.length > 0) {
        const insertRes = await supabase
          .from("user_hobbies")
          .upsert(
            added.map((hobby) => ({ user_id: userId, hobby })),
            { onConflict: "user_id,hobby" }
          );
        if (insertRes.error) {
          setFeedback({ tone: "error", message: insertRes.error.message });
          return;
        }
      }

      const savedForm = { ...form, hobbies: nextHobbies };
      setForm(savedForm);
      setInitialForm(savedForm);
      setFeedback({ tone: "success", message: "Profil enregistre avec succes." });
    } catch (err) {
      setFeedback({
        tone: "error",
        message: err instanceof Error ? err.message : "Une erreur inattendue est survenue pendant l'enregistrement.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Mon profil">
      {state.status === "loading" ? <StateCard title="Chargement du profil..." text="On recupere tes informations, tes loisirs et ton dernier resultat." /> : null}
      {state.status === "error" ? <StateCard title="Impossible de charger ton profil" text={state.message} error /> : null}
      {state.status === "empty" ? <StateCard title="Profil vide" text={state.message} /> : null}

      {state.status === "ready" ? (
        <main className="profile-page">
          <h1>Mon profil</h1>
          <p className="subtitle">Les informations visibles par les autres dans l&apos;annuaire.</p>

          <section className="profile-edit-header">
            <div className="profile-photo-area">
              <div className="avatar avatar-xl">{initials}</div>
              <button className="photo-edit-btn" type="button" title="Modifier la photo" aria-label="Modifier la photo">
                <span aria-hidden="true">✎</span>
              </button>
            </div>

            <div className="profile-info-area">
              <h2>{displayPseudo(form.pseudo, email)}</h2>
              <div className="profile-meta">
                <span className="mbti">{mbtiLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{metaStudy}</span>
                {email ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{email}</span>
                  </>
                ) : null}
              </div>

              <div className="photo-options">
                <button className="photo-option-btn" type="button" disabled>
                  Importer une photo
                </button>
                <button className="photo-option-btn" type="button">
                  Utiliser mes initiales
                </button>
              </div>

              <p className="photo-help">JPG ou PNG · max 5 MB · carre recommande</p>
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-title">
              <h3>Ta bio</h3>
              <span className="char-count">{form.bio.length} / {BIO_MAX}</span>
            </div>
            <p className="help-text">Raconte qui tu es en quelques mots. Cette bio sera visible sur ta fiche Buddy.</p>
            <div className="input-group no-margin">
              <textarea
                value={form.bio}
                maxLength={BIO_MAX}
                onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Ex: En PM a l'ISCAE, passionnee de lecture et de cuisine..."
              />
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-title">
              <h3>Ce que tu cherches</h3>
              <span className="char-count">{form.lookingFor.length} / {LOOKING_FOR_MAX}</span>
            </div>
            <p className="help-text">Un resume de ton attente cote Buddy.</p>
            <div className="input-group no-margin">
              <textarea
                className="short-textarea"
                value={form.lookingFor}
                maxLength={LOOKING_FOR_MAX}
                onChange={(event) => setForm((prev) => ({ ...prev, lookingFor: event.target.value }))}
                placeholder="Ex: Un partenaire d'etude matinal, serieux et bienveillant."
              />
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-title">
              <h3>Tes loisirs</h3>
              <span className="char-count">{form.hobbies.length} / {HOBBIES_MAX}</span>
            </div>
            <form className="loisirs-add-form" onSubmit={onHobbySubmit}>
              <input
                value={hobbyDraft}
                onChange={(event) => setHobbyDraft(event.target.value)}
                placeholder="Ajouter un loisir"
                maxLength={48}
                aria-label="Ajouter un loisir"
              />
              <button className="loisirs-add-btn" type="submit">
                + Ajouter
              </button>
            </form>
            <div className="loisirs-edit-grid">
              {form.hobbies.length > 0 ? (
                form.hobbies.map((hobby) => (
                  <button
                    className="loisirs-edit-chip"
                    key={hobby}
                    type="button"
                    onClick={() => {
                      setFeedback(null);
                      setForm((prev) => ({ ...prev, hobbies: prev.hobbies.filter((item) => item !== hobby) }));
                    }}
                  >
                    <span aria-hidden="true">{hobbyEmoji(hobby)}</span>
                    {hobby} <span className="remove" aria-hidden="true">×</span>
                  </button>
                ))
              ) : (
                <p className="empty-text">Aucun loisir ajoute pour le moment.</p>
              )}
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-title">
              <h3>Tes preferences</h3>
            </div>
            <div className="input-group">
              <label htmlFor="profile-pseudo">Pseudo</label>
              <input
                id="profile-pseudo"
                type="text"
                value={form.pseudo}
                maxLength={40}
                onChange={(event) => setForm((prev) => ({ ...prev, pseudo: event.target.value }))}
                placeholder="Ex: ghita_b"
              />
            </div>
            <div className="input-group">
              <label htmlFor="profile-study-level">Niveau d&apos;etudes</label>
              <input
                id="profile-study-level"
                type="text"
                value={form.studyLevel}
                maxLength={60}
                onChange={(event) => setForm((prev) => ({ ...prev, studyLevel: event.target.value }))}
                placeholder="Ex: PM - ISCAE"
              />
            </div>
            <div className="preference-grid" aria-label="Preferences issues du profil">
              <div className="input-group">
                <label htmlFor="profile-productive">Moment productif</label>
                <select id="profile-productive" value="Non renseigne" disabled>
                  <option>Non renseigne</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="profile-work-mode">Mode de travail prefere</label>
                <select id="profile-work-mode" value="Non renseigne" disabled>
                  <option>Non renseigne</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="profile-support">Type de soutien recherche</label>
                <select id="profile-support" value="Non renseigne" disabled>
                  <option>Non renseigne</option>
                </select>
              </div>
              <div className="input-group no-margin">
                <label htmlFor="profile-communication">Communication preferee</label>
                <select id="profile-communication" value="Non renseigne" disabled>
                  <option>Non renseigne</option>
                </select>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-title">
              <h3>Visibilite</h3>
            </div>
            <div className="visibility-toggle">
              <div>
                <h4>Profil visible dans l&apos;annuaire</h4>
                <p>Les autres etudiant·es pourront te trouver comme Buddy.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(event) => setForm((prev) => ({ ...prev, isVisible: event.target.checked }))}
                />
                <span className="slider" />
              </label>
            </div>
          </section>

          {feedback ? (
            <p className={`profile-feedback ${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"}>
              {feedback.message}
            </p>
          ) : null}

          <div className="save-bar">
            <button className="btn btn-tertiary" type="button" onClick={onCancel} disabled={!isDirty || saving}>
              Annuler
            </button>
            <button className="btn btn-primary" type="button" onClick={onSave} disabled={!isDirty || saving}>
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </main>
      ) : null}

      <style jsx>{`
        .profile-page {
          --plum: #7e3d5e;
          --lavande: #8a6889;
          --bleu-ciel: #2e8bbf;
          --texte: #1a1a2e;
          --texte-gris: #4a5568;
          --texte-clair: #718096;
          --fond-creme: #fdfbfc;
          --fond-lavande: #f5f0f7;
          --bordure: #e5e0ec;
          --gradient-signature: linear-gradient(135deg, #7e3d5e 0%, #8a6889 45%, #2e8bbf 100%);
          --ombre-sm: 0 2px 8px rgba(26, 26, 46, 0.06);
          --ombre-md: 0 8px 24px rgba(26, 26, 46, 0.1);
          width: 100%;
          max-width: 900px;
          margin: 0;
          padding: 28px 16px 90px;
          color: var(--texte);
          background: var(--fond-creme);
        }
        .profile-page h1,
        .profile-page h2,
        .profile-page h3,
        .profile-page h4 {
          color: var(--texte);
          line-height: 1.2;
        }
        .profile-page h1 {
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 4px;
        }
        .subtitle {
          color: var(--texte-clair);
          margin: 0 0 24px;
          font-size: 15px;
        }
        .avatar {
          border-radius: 50%;
          background: var(--gradient-signature);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          overflow: hidden;
          flex-shrink: 0;
        }
        .avatar-xl {
          width: 100px;
          height: 100px;
          font-size: 36px;
        }
        .profile-edit-header,
        .profile-section {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          box-shadow: var(--ombre-sm);
        }
        .profile-edit-header {
          display: flex;
          gap: 20px;
          align-items: center;
          padding: 24px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .profile-photo-area {
          position: relative;
        }
        .photo-edit-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid var(--plum);
          color: var(--plum);
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--ombre-sm);
        }
        .photo-edit-btn:hover {
          background: var(--plum);
          color: #fff;
        }
        .profile-info-area {
          flex: 1;
          min-width: 220px;
        }
        .profile-info-area h2 {
          margin: 0 0 4px;
          font-size: 26px;
        }
        .profile-meta {
          display: flex;
          gap: 10px;
          color: var(--texte-clair);
          font-size: 13px;
          flex-wrap: wrap;
        }
        .profile-meta .mbti {
          font-weight: 600;
          color: var(--plum);
        }
        .photo-options {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .photo-option-btn {
          padding: 8px 14px;
          background: var(--fond-lavande);
          border: 1.5px solid var(--bordure);
          border-radius: 10px;
          font-size: 13px;
          color: var(--texte-gris);
          cursor: pointer;
        }
        .photo-option-btn:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }
        .photo-option-btn:hover:not(:disabled) {
          border-color: var(--plum);
          color: var(--plum);
        }
        .photo-help {
          font-size: 12px;
          color: var(--texte-clair);
          margin: 10px 0 0;
        }
        .profile-section {
          padding: 22px;
          margin-bottom: 18px;
        }
        .profile-section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
        }
        .profile-section-title h3 {
          font-size: 17px;
          margin: 0;
        }
        .char-count {
          font-size: 12px;
          color: var(--texte-clair);
          font-weight: 500;
          white-space: nowrap;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .input-group.no-margin {
          margin-bottom: 0;
        }
        .input-group label {
          font-size: 14px;
          font-weight: 500;
          color: var(--texte);
        }
        textarea,
        select,
        input[type="text"],
        .loisirs-add-form input {
          width: 100%;
          border: 1.5px solid var(--bordure);
          border-radius: 12px;
          background: #fff;
          font: inherit;
          font-size: 14px;
          color: var(--texte);
          transition: 0.2s;
        }
        textarea {
          min-height: 90px;
          resize: vertical;
          line-height: 1.5;
          padding: 14px 16px;
        }
        .short-textarea {
          min-height: 60px;
        }
        select,
        input[type="text"],
        .loisirs-add-form input {
          height: 48px;
          padding: 0 14px;
        }
        select:disabled {
          color: var(--texte-clair);
          background: #fafafa;
        }
        textarea:focus,
        select:focus,
        input:focus {
          outline: none;
          border-color: var(--plum);
          box-shadow: 0 0 0 3px rgba(126, 61, 94, 0.1);
        }
        .help-text {
          font-size: 13px;
          color: var(--texte-clair);
          margin: 0 0 12px;
        }
        .loisirs-add-form {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }
        .loisirs-edit-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .loisirs-edit-chip {
          padding: 6px 14px;
          background: var(--fond-lavande);
          border: 0;
          border-radius: 9999px;
          font-size: 13px;
          color: var(--plum);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .loisirs-edit-chip .remove {
          font-size: 13px;
          opacity: 0.7;
        }
        .loisirs-add-btn {
          padding: 6px 14px;
          background: #fff;
          border: 1.5px dashed var(--bordure);
          border-radius: 9999px;
          font-size: 13px;
          color: var(--texte-gris);
          cursor: pointer;
          white-space: nowrap;
        }
        .loisirs-add-btn:hover {
          border-color: var(--plum);
          color: var(--plum);
        }
        .empty-text {
          margin: 0;
          color: var(--texte-clair);
          font-size: 13px;
        }
        .preference-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0 14px;
        }
        .visibility-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px;
          background: var(--fond-lavande);
          border-radius: 12px;
        }
        .visibility-toggle h4 {
          font-size: 14px;
          margin: 0 0 3px;
        }
        .visibility-toggle p {
          font-size: 12px;
          color: var(--texte-gris);
          margin: 0;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: var(--bordure);
          border-radius: 26px;
          transition: 0.3s;
        }
        .slider::before {
          content: "";
          position: absolute;
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.3s;
        }
        input:checked + .slider {
          background: var(--plum);
        }
        input:checked + .slider::before {
          transform: translateX(22px);
        }
        .profile-feedback {
          margin: 0 0 18px;
          padding: 10px 12px;
          border: 1px solid;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        .profile-feedback.error {
          color: #b42318;
          background: #fff6f6;
          border-color: #f4c9c5;
        }
        .profile-feedback.success {
          color: #166534;
          background: #f0fdf4;
          border-color: #b7e9c3;
        }
        .save-bar {
          position: sticky;
          bottom: 16px;
          display: flex;
          gap: 10px;
          padding: 14px;
          background: #fff;
          border-radius: 14px;
          border: 1px solid var(--bordure);
          box-shadow: var(--ombre-md);
          margin-top: 24px;
          z-index: 5;
        }
        .btn {
          flex: 1;
          min-height: 46px;
          border-radius: 12px;
          border: 0;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
        }
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }
        .btn-primary {
          background: var(--plum);
          color: #fff;
        }
        .btn-primary:hover:not(:disabled) {
          background: #6b324f;
        }
        .btn-tertiary {
          background: #fff;
          color: var(--plum);
          border: 1.5px solid var(--plum);
        }
        .btn-tertiary:hover:not(:disabled) {
          background: var(--fond-lavande);
        }
        .state-card {
          max-width: 760px;
          margin: 0;
          padding: 22px;
          border: 1px solid #e4dcea;
          border-radius: 14px;
          background: #fff;
          color: #26365a;
        }
        .state-card.error {
          border-color: #f0c4cb;
          background: #fff8f9;
        }
        .state-card h2 {
          margin: 0 0 8px;
        }
        .state-card p {
          margin: 0;
          color: #59657f;
        }
        @media (max-width: 650px) {
          .profile-page {
            padding: 24px 15px 90px;
          }
          .profile-page h1 {
            font-size: 34px;
          }
          .profile-edit-header {
            align-items: flex-start;
          }
          .preference-grid {
            grid-template-columns: 1fr;
          }
          .loisirs-add-form,
          .save-bar {
            flex-direction: column;
          }
        }
      `}</style>
      <style jsx global>{`
        .state-card {
          max-width: 760px;
          margin: 0;
          padding: 22px;
          border: 1px solid #e4dcea;
          border-radius: 14px;
          background: #fff;
          color: #26365a;
        }
        .state-card.error {
          border-color: #f0c4cb;
          background: #fff8f9;
        }
        .state-card h2 {
          margin: 0 0 8px;
        }
        .state-card p {
          margin: 0;
          color: #59657f;
        }
      `}</style>
    </AppLayout>
  );
}

function StateCard({ title, text, error = false }: { title: string; text: string; error?: boolean }) {
  return (
    <section className={`state-card ${error ? "error" : ""}`} role={error ? "alert" : "status"}>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
