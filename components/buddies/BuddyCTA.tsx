"use client";

import { FormEvent, useMemo, useState } from "react";

type BuddyCTAProps = {
  isSelf: boolean;
  existingStatus: "pending" | "accepted" | null;
  onSendRequest: (message: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function BuddyCTA({ isSelf, existingStatus, onSendRequest }: BuddyCTAProps) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const disabledReason = useMemo(() => {
    if (isSelf) return "Tu ne peux pas t'envoyer une demande a toi-meme.";
    if (existingStatus === "accepted") return "Vous etes deja buddies.";
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
    </section>
  );
}
