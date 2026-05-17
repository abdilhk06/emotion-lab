"use client";

import { FormEvent, useMemo, useState } from "react";

type BuddyCTAProps = {
  isSelf: boolean;
  existingStatus: "pending" | "accepted" | null;
  conversationId: string | null;
  onSendRequest: (message: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  onOpenConversation: () => void;
};

export function BuddyCTA({ isSelf, existingStatus, conversationId, onSendRequest, onOpenConversation }: BuddyCTAProps) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const disabledReason = useMemo(() => {
    if (isSelf) return "Tu ne peux pas t'envoyer une demande a toi-meme.";
    if (existingStatus === "accepted") return null;
    if (existingStatus === "pending") return "Une demande est deja en attente.";
    return null;
  }, [existingStatus, isSelf]);

  const canSend = !disabledReason && state !== "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    setState("submitting");
    setErrorMessage(null);

    const result = await onSendRequest(message.trim());
    if (!result.ok) {
      setState("error");
      setErrorMessage(result.message);
      return;
    }

    setState("success");
    setMessage("");
  }

  return (
    <section className="buddy-section">
      {existingStatus === "accepted" ? (
        <div className="buddy-cta">
          <button type="button" className="btn btn-primary btn-lg" onClick={onOpenConversation}>
            {conversationId ? "Envoyer un message" : "Ouvrir la messagerie"}
          </button>
          <p className="buddy-muted">Vous etes deja buddies. Discussion disponible tout de suite.</p>
        </div>
      ) : null}
      {existingStatus !== "accepted" ? (
        <form className="buddy-cta" onSubmit={handleSubmit}>
          <label className="buddy-label" htmlFor="buddy-request-message">
            Message (optionnel)
          </label>
          <textarea
            id="buddy-request-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Salut ! On pourrait reviser ensemble cette semaine ?"
            maxLength={280}
            disabled={!canSend}
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={!canSend}>
            {state === "submitting" ? "Envoi en cours..." : "Envoyer une demande"}
          </button>
          {disabledReason ? <p className="buddy-muted">{disabledReason}</p> : null}
          {state === "success" ? <p className="buddy-success">Demande envoyee avec succes.</p> : null}
          {state === "error" && errorMessage ? <p className="buddy-error">{errorMessage}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
