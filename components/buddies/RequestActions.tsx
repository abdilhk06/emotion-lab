type RequestActionsProps = {
  canAct: boolean;
  busyAction: "accept" | "reject" | null;
  disabled?: boolean;
  successMessage?: string | null;
  onAccept: () => void;
  onReject: () => void;
};

export function RequestActions({
  canAct,
  busyAction,
  disabled = false,
  successMessage,
  onAccept,
  onReject,
}: RequestActionsProps) {
  if (!canAct) {
    return (
      <div className="request-action-readonly">
        <p>Demande en lecture seule.</p>
      </div>
    );
  }

  const acceptDisabled = disabled || busyAction !== null;
  const rejectDisabled = disabled || busyAction !== null;

  return (
    <div className="request-actions">
      <button type="button" className="btn btn-primary" disabled={acceptDisabled} onClick={onAccept}>
        {busyAction === "accept" ? "Acceptation..." : "Accepter"}
      </button>
      <button type="button" className="btn request-btn-ghost" disabled={rejectDisabled} onClick={onReject}>
        {busyAction === "reject" ? "Refus..." : "Refuser"}
      </button>
      {successMessage ? <p className="request-action-success">{successMessage}</p> : null}
      <style jsx>{`
        .request-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .request-btn-ghost {
          background: #fff;
          color: var(--texte-gris);
          border: 1px solid var(--bordure);
        }
        .request-action-readonly p,
        .request-action-success {
          margin: 0;
          font-size: 13px;
        }
        .request-action-readonly p {
          color: var(--texte-clair);
        }
        .request-action-success {
          color: #0e9f6e;
          font-weight: 600;
        }
        @media (max-width: 699px) {
          .request-actions :global(.btn) {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
