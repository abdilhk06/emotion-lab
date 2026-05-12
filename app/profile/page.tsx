"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { BioEditor } from "@/components/profile/BioEditor";
import { HobbiesEditor } from "@/components/profile/HobbiesEditor";
import { LookingForEditor } from "@/components/profile/LookingForEditor";
import { ProfileEditHeader } from "@/components/profile/ProfileEditHeader";
import { SaveBar } from "@/components/profile/SaveBar";
import { VisibilityToggle } from "@/components/profile/VisibilityToggle";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  study_level: string | null;
  bio: string | null;
  looking_for: string | null;
  is_visible: boolean;
};

type HobbyRow = {
  hobby: string;
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

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/results", label: "Mes resultats" },
  { href: "/buddies", label: "Annuaire Buddy" },
  { href: "/messages", label: "Messagerie" },
  { href: "/resources", label: "Ressources" },
  { href: "/profile", label: "Mon profil", active: true },
];

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

function initialsFromPseudo(pseudo: string): string {
  const clean = pseudo.trim().replace(/^@+/, "");
  if (!clean) return "EL";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormValues>(EMPTY_FORM);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
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

        const [profileRes, hobbiesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, pseudo, study_level, bio, looking_for, is_visible")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>(),
          supabase.from("user_hobbies").select("hobby").eq("user_id", user.id).returns<HobbyRow[]>(),
        ]);

        const firstError = profileRes.error ?? hobbiesRes.error;
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
          isVisible: profileRes.data.is_visible,
          hobbies: (hobbiesRes.data ?? []).map((item) => item.hobby).filter(Boolean).sort((a, b) => a.localeCompare(b, "fr")),
        };

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
  const initials = useMemo(() => initialsFromPseudo(form.pseudo), [form.pseudo]);

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
    setValidationError(null);
    setSaveSuccess(null);
    const normalized = normalizeHobby(hobbyDraft);
    if (!normalized) {
      setValidationError("Entre un loisir avant de l'ajouter.");
      return;
    }
    if (normalized.length < 2) {
      setValidationError("Le loisir doit contenir au moins 2 caracteres.");
      return;
    }
    if (form.hobbies.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setValidationError("Ce loisir est deja dans ta liste.");
      return;
    }
    if (form.hobbies.length >= HOBBIES_MAX) {
      setValidationError("Tu as atteint la limite de 15 loisirs.");
      return;
    }
    setForm((prev) => ({ ...prev, hobbies: [...prev.hobbies, normalized].sort((a, b) => a.localeCompare(b, "fr")) }));
    setHobbyDraft("");
  };

  const onCancel = () => {
    setForm(initialForm);
    setHobbyDraft("");
    setValidationError(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const onSave = async () => {
    setValidationError(null);
    setSaveError(null);
    setSaveSuccess(null);

    const error = validateForm(form);
    if (error) {
      setValidationError(error);
      return;
    }

    if (!userId) {
      setSaveError("Session invalide. Reconnecte-toi puis reessaie.");
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();

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
        setSaveError(updateRes.error.message);
        return;
      }

      const deleteRes = await supabase.from("user_hobbies").delete().eq("user_id", userId);
      if (deleteRes.error) {
        setSaveError(deleteRes.error.message);
        return;
      }

      if (form.hobbies.length > 0) {
        const insertRes = await supabase
          .from("user_hobbies")
          .insert(form.hobbies.map((hobby) => ({ user_id: userId, hobby: hobby.trim() })));

        if (insertRes.error) {
          setSaveError(insertRes.error.message);
          return;
        }
      }

      setInitialForm(form);
      setSaveSuccess("Profil enregistre avec succes.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Une erreur inattendue est survenue pendant l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Mon profil" nav={NAV}>
      {state.status === "loading" ? (
        <section className="profile-state-card" role="status" aria-live="polite">
          <h2>Chargement du profil...</h2>
          <p>On recupere tes informations et tes loisirs.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="profile-state-card profile-state-error" role="alert">
          <h2>Impossible de charger ton profil</h2>
          <p>{state.message}</p>
        </section>
      ) : null}

      {state.status === "empty" ? (
        <section className="profile-state-card" role="status">
          <h2>Profil vide</h2>
          <p>{state.message}</p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <div className="profile-stack">
          <ProfileEditHeader pseudo={form.pseudo} studyLevel={form.studyLevel} initials={initials} />

          <div className="profile-grid">
            <div className="profile-col-main">
              <BioEditor value={form.bio} maxLength={BIO_MAX} onChange={(value) => setForm((prev) => ({ ...prev, bio: value }))} />
              <LookingForEditor value={form.lookingFor} maxLength={LOOKING_FOR_MAX} onChange={(value) => setForm((prev) => ({ ...prev, lookingFor: value }))} />
              <HobbiesEditor
                hobbies={form.hobbies}
                draftValue={hobbyDraft}
                onDraftChange={setHobbyDraft}
                onAdd={onAddHobby}
                onRemove={(hobby) => {
                  setValidationError(null);
                  setSaveSuccess(null);
                  setForm((prev) => ({ ...prev, hobbies: prev.hobbies.filter((item) => item !== hobby) }));
                }}
              />
            </div>

            <div className="profile-col-side">
              <AvatarUploader initials={initials} pseudo={form.pseudo} />

              <section className="profile-card">
                <div className="profile-card-head">
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
                <div className="input-group" style={{ marginBottom: 0 }}>
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
              </section>

              <VisibilityToggle checked={form.isVisible} onChange={(value) => setForm((prev) => ({ ...prev, isVisible: value }))} />
            </div>
          </div>

          {validationError ? (
            <p className="profile-feedback profile-feedback-error" role="alert">
              {validationError}
            </p>
          ) : null}
          {saveError ? (
            <p className="profile-feedback profile-feedback-error" role="alert">
              {saveError}
            </p>
          ) : null}
          {saveSuccess ? (
            <p className="profile-feedback profile-feedback-success" role="status">
              {saveSuccess}
            </p>
          ) : null}

          <SaveBar onCancel={onCancel} onSave={onSave} saving={saving} disabled={!isDirty} dirty={isDirty} />
        </div>
      ) : null}

      <style jsx>{`
        .profile-stack {
          display: grid;
          gap: 14px;
        }
        .profile-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: 1.2fr 1fr;
        }
        .profile-col-main,
        .profile-col-side {
          display: grid;
          gap: 14px;
        }
        .profile-card,
        .profile-state-card,
        .profile-edit-header-card {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 16px;
        }
        .profile-state-card h2 {
          margin: 0 0 8px;
        }
        .profile-state-card p {
          margin: 0;
          color: var(--texte-gris);
        }
        .profile-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }
        .profile-edit-header-card {
          background: linear-gradient(125deg, #fcf8ff 0%, #f8f4fb 45%, #f3f9ff 100%);
        }
        .profile-title-wrap h2 {
          margin: 0;
        }
        .profile-title-wrap p {
          margin: 6px 0 0;
          color: var(--texte-gris);
        }
        .profile-identity {
          margin-top: 14px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .profile-identity h3 {
          margin: 0;
          color: var(--plum);
        }
        .profile-identity p {
          margin: 4px 0 0;
          color: var(--texte-gris);
          font-size: 14px;
        }
        .profile-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .profile-card-head h3 {
          margin: 0;
        }
        .char-count {
          color: var(--texte-clair);
          font-size: 12px;
          font-weight: 600;
        }
        .profile-helper {
          margin: 0 0 10px;
          font-size: 13px;
          color: var(--texte-gris);
        }
        .profile-helper-muted {
          margin-bottom: 0;
          color: var(--texte-clair);
        }
        .profile-textarea {
          width: 100%;
          min-height: 110px;
          border: 1px solid var(--bordure);
          border-radius: 12px;
          padding: 12px;
          resize: vertical;
          font: inherit;
        }
        .profile-textarea-sm {
          min-height: 80px;
        }
        .avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: var(--gradient-signature);
          color: #fff;
          font-family: "Poppins", sans-serif;
          font-weight: 800;
        }
        .avatar-xl {
          width: 68px;
          height: 68px;
          font-size: 24px;
        }
        .avatar-strong {
          box-shadow: 0 12px 24px rgba(61, 76, 122, 0.18);
        }
        .avatar-uploader {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .hobbies-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .hobbies-input-row input {
          flex: 1;
          min-width: 0;
          height: 44px;
          border: 1px solid var(--bordure);
          border-radius: 12px;
          padding: 0 12px;
          font: inherit;
        }
        .hobbies-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .hobby-chip {
          border-radius: 999px;
          border: 1px solid #e4dbe8;
          background: #faf2f8;
          color: var(--plum);
          padding: 7px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        .visibility-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .visibility-toggle h4 {
          margin: 0 0 6px;
          font-size: 15px;
        }
        .visibility-toggle p {
          margin: 0;
          color: var(--texte-gris);
          font-size: 13px;
        }
        .switch {
          position: relative;
          width: 52px;
          height: 30px;
          flex: 0 0 auto;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: #d6cfdd;
          transition: background 0.2s ease;
          cursor: pointer;
        }
        .slider::before {
          content: "";
          position: absolute;
          width: 24px;
          height: 24px;
          left: 3px;
          top: 3px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        .switch input:checked + .slider {
          background: var(--bleu-ciel);
        }
        .switch input:checked + .slider::before {
          transform: translateX(22px);
        }
        .save-bar {
          position: sticky;
          bottom: 10px;
          z-index: 5;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px;
          border: 1px solid var(--bordure);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
        }
        .profile-feedback {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid;
        }
        .profile-feedback-error {
          color: #b42318;
          background: #fff6f6;
          border-color: #f4c9c5;
        }
        .profile-feedback-success {
          color: #166534;
          background: #f0fdf4;
          border-color: #b7e9c3;
        }
        @media (max-width: 1023px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .save-bar {
            bottom: 6px;
            flex-direction: column;
          }
          .save-bar :global(.btn) {
            width: 100%;
          }
          .hobbies-input-row {
            flex-direction: column;
          }
          .hobbies-input-row :global(.btn) {
            width: 100%;
          }
          .avatar-uploader {
            align-items: flex-start;
          }
        }
      `}</style>
    </AppLayout>
  );
}
