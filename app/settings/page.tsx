"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { DangerZone } from "@/components/settings/DangerZone";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  is_visible: boolean;
};

type NotificationsState = {
  buddyRequests: boolean;
  messages: boolean;
  chatbotReminders: boolean;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

export default function SettingsPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationsState>({
    buddyRequests: true,
    messages: true,
    chatbotReminders: false,
  });

  useEffect(() => {
    const run = async () => {
      setState({ status: "loading" });
      setFeedbackError(null);
      setFeedbackSuccess(null);

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

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, pseudo, is_visible")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profileError) {
          setState({ status: "error", message: profileError.message });
          return;
        }

        setEmail(user.email ?? "Email indisponible");
        setIsVisible(profile?.is_visible ?? true);
        setState({ status: "ready" });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger tes parametres.",
        });
      }
    };

    void run();
  }, [router]);

  const onVisibilityChange = async (nextValue: boolean) => {
    setSavingVisibility(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

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

      const { error } = await supabase.from("profiles").update({ is_visible: nextValue }).eq("id", user.id);

      if (error) {
        setFeedbackError(error.message);
        return;
      }

      setIsVisible(nextValue);
      setFeedbackSuccess("Parametre de confidentialite enregistre.");
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Une erreur est survenue pendant la sauvegarde.");
    } finally {
      setSavingVisibility(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setFeedbackError(error.message);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setFeedbackError("Impossible de te deconnecter pour le moment.");
    } finally {
      setLoggingOut(false);
    }
  };

  const onAskDelete = () => {
    setFeedbackError(null);
    setFeedbackSuccess("Suppression de compte non disponible en v1. Contacte le support pour une demande manuelle.");
  };

  const statusMessage = useMemo(() => {
    if (savingVisibility) return "Sauvegarde en cours...";
    if (loggingOut) return "Deconnexion en cours...";
    return null;
  }, [loggingOut, savingVisibility]);

  return (
    <AppLayout title="Parametres">
      {state.status === "loading" ? (
        <section className="settings-state-card" role="status" aria-live="polite">
          <h2>Chargement des parametres...</h2>
          <p>On prepare ton espace compte, confidentialite et securite.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="settings-state-card settings-state-error" role="alert">
          <h2>Impossible de charger la page</h2>
          <p>{state.message}</p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <div className="settings-stack">
          <AccountSettings email={email} />

          <div className="settings-grid">
            <NotificationSettings values={notifications} onChange={setNotifications} />
            <PrivacySettings isVisible={isVisible} onVisibilityChange={onVisibilityChange} saving={savingVisibility} />
          </div>

          <SecuritySettings onLogout={onLogout} logoutLoading={loggingOut} />
          <DangerZone onAskDelete={onAskDelete} />

          {statusMessage ? (
            <p className="settings-feedback" role="status">
              {statusMessage}
            </p>
          ) : null}

          {feedbackSuccess ? (
            <p className="settings-feedback settings-feedback-success" role="status">
              {feedbackSuccess}
            </p>
          ) : null}

          {feedbackError ? (
            <p className="settings-feedback settings-feedback-error" role="alert">
              {feedbackError}
            </p>
          ) : null}
        </div>
      ) : null}

      <style jsx>{`
        .settings-stack {
          display: grid;
          gap: 14px;
        }
        .settings-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .settings-state-card,
        :global(.settings-card),
        :global(.danger-zone-card) {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 16px;
        }
        .settings-state-card h2 {
          margin: 0 0 8px;
        }
        .settings-state-card p {
          margin: 0;
          color: var(--texte-gris);
        }
        .settings-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }
        :global(.settings-card-head) {
          margin-bottom: 10px;
        }
        :global(.settings-card-head h2),
        :global(.danger-zone-card h2) {
          margin: 0;
          color: var(--plum);
        }
        :global(.settings-row) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid #f0ebf5;
        }
        :global(.settings-row:last-of-type) {
          border-bottom: 0;
          padding-bottom: 0;
        }
        :global(.settings-row h3) {
          margin: 0 0 4px;
          font-size: 15px;
        }
        :global(.settings-row p),
        :global(.settings-note),
        :global(.danger-zone-card p) {
          margin: 0;
          color: var(--texte-gris);
          font-size: 13px;
        }
        :global(.settings-note) {
          margin-top: 10px;
        }
        :global(.settings-card-softblue) {
          background: linear-gradient(140deg, #f7f9ff 0%, #f2f7ff 100%);
        }
        :global(.settings-btn-sm) {
          min-height: 40px;
          padding: 10px 14px;
          font-size: 13px;
          white-space: nowrap;
        }
        :global(.settings-link) {
          color: var(--bleu-ciel);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }
        :global(.danger-zone-card) {
          background: linear-gradient(150deg, #fff4f5 0%, #fff8f8 100%);
          border-color: #f3c7ce;
        }
        :global(.settings-btn-danger) {
          background: transparent;
          color: #b42318;
          border: 1px solid #f0b8b2;
          padding: 10px 14px;
          min-height: 40px;
        }
        .settings-feedback {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #d8d2e3;
          background: #faf9fd;
        }
        .settings-feedback-success {
          color: #166534;
          background: #f0fdf4;
          border-color: #b7e9c3;
        }
        .settings-feedback-error {
          color: #b42318;
          background: #fff6f6;
          border-color: #f4c9c5;
        }
        :global(.switch) {
          position: relative;
          width: 52px;
          height: 30px;
          flex: 0 0 auto;
        }
        :global(.switch input) {
          opacity: 0;
          width: 0;
          height: 0;
        }
        :global(.slider) {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: #d6cfdd;
          transition: background 0.2s ease;
          cursor: pointer;
        }
        :global(.slider::before) {
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
        :global(.switch input:checked + .slider) {
          background: var(--bleu-ciel);
        }
        :global(.switch input:checked + .slider::before) {
          transform: translateX(22px);
        }
        @media (max-width: 1023px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          :global(.settings-row) {
            align-items: flex-start;
            flex-direction: column;
          }
          :global(.settings-row .switch),
          :global(.settings-row .settings-link),
          :global(.settings-row .btn) {
            margin-top: 6px;
          }
          :global(.settings-row .btn) {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
