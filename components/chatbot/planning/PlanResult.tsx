"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Fragment } from "react";
import type { PlannerResponse } from "@/lib/chatbot/planner-schema";
import { PlanPdfDocument } from "@/components/chatbot/planning/PlanPdfDocument";

type PlanAction = PlannerResponse["actions_suggerees"][number];

export type PlanResultActions = {
  onRegenerate?: () => void;
  onEditTask?: () => void;
  onAddTask?: () => void;
  canAddTask?: boolean;
  isBusy?: boolean;
};

type PlanResultProps = {
  plan: PlannerResponse;
  actions?: PlanResultActions;
};

const ACTION_ORDER: PlanAction[] = ["export_pdf", "edit_task", "add_task", "regenerate"];

const ACTION_LABEL: Record<PlanAction, string> = {
  regenerate: "Regenerer",
  edit_task: "Modifier une tache",
  add_task: "Ajouter une tache",
  export_pdf: "Exporter PDF",
};

function groupByDay(slots: PlannerResponse["planning"]) {
  const byKey = new Map<string, { key: string; date: string; jour: string; slots: PlannerResponse["planning"] }>();

  slots.forEach((slot) => {
    const key = `${slot.date}-${slot.jour}`;
    const current = byKey.get(key);
    if (current) {
      current.slots.push(slot);
      return;
    }

    byKey.set(key, { key, date: slot.date, jour: slot.jour, slots: [slot] });
  });

  return Array.from(byKey.values());
}

function importanceTone(value: string): "high" | "medium" | "low" {
  const clean = value.toLowerCase();
  const numeric = Number.parseInt(clean, 10);
  if (Number.isFinite(numeric)) {
    if (numeric >= 8) return "high";
    if (numeric >= 5) return "medium";
    return "low";
  }

  if (clean.includes("haute") || clean.includes("elevee") || clean.includes("urgent")) return "high";
  if (clean.includes("faible") || clean.includes("basse")) return "low";
  return "medium";
}

function actionList(plan: PlannerResponse): PlanAction[] {
  return ACTION_ORDER.filter((action) => plan.actions_suggerees.includes(action));
}

function sanitizeFilenamePart(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "planning"
  );
}

export function PlanResult({ plan, actions }: PlanResultProps) {
  const groups = groupByDay(plan.planning);
  const availableActions = actionList(plan);
  const pdfFileName = `emotion-lab-plan-${sanitizeFilenamePart(plan.synthese.deadline_globale)}.pdf`;
  const canAddTask = actions?.canAddTask ?? true;
  const isBusy = actions?.isBusy ?? false;

  const runAction = (action: PlanAction) => {
    if (action === "regenerate") actions?.onRegenerate?.();
    if (action === "edit_task") actions?.onEditTask?.();
    if (action === "add_task" && canAddTask) actions?.onAddTask?.();
  };

  return (
    <section className="plan-result" aria-label="Plan genere">
      <div className="result-intro">
        <div className="intro-copy">
          <p className="eyebrow">Plan personnalise</p>
          <h2>{plan.synthese.methode_recommandee}</h2>
          <p className="intro-text">
            {plan.synthese.duree_planning_jours} jour{plan.synthese.duree_planning_jours > 1 ? "s" : ""} de travail structure, avec les priorites visibles par creneau.
          </p>
        </div>
        <dl className="synthesis-grid" aria-label="Synthese du plan">
          <div>
            <dt>Taches</dt>
            <dd>{plan.synthese.nb_taches}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{plan.synthese.deadline_globale}</dd>
          </div>
          <div>
            <dt>Charge</dt>
            <dd>{plan.synthese.charge_totale_minutes} min</dd>
          </div>
          <div>
            <dt>Fenetre</dt>
            <dd>
              {plan.synthese.duree_planning_jours} jour{plan.synthese.duree_planning_jours > 1 ? "s" : ""}
            </dd>
          </div>
        </dl>
      </div>

      <section className="planning-section" aria-labelledby="planning-title">
        <div className="section-head">
          <p className="eyebrow">Creneaux</p>
          <h3 id="planning-title">Planning detaille</h3>
        </div>

        <div className="mobile-days">
          {groups.map((group) => (
            <section className="day-group" key={group.key} aria-label={`${group.jour} ${group.date}`}>
              <header className="day-heading">
                <strong>{group.jour}</strong>
                <span>{group.date}</span>
              </header>
              <div className="slot-stack">
                {group.slots.map((slot, index) => (
                  <article key={`${slot.date}-${slot.heure_debut}-${slot.tache}-${index}`} className={`slot-card ${importanceTone(slot.importance)}`}>
                    <div className="slot-topline">
                      <span className="slot-time">
                        {slot.heure_debut} - {slot.heure_fin}
                      </span>
                      <span className={`importance-badge ${importanceTone(slot.importance)}`}>Imp. {slot.importance}</span>
                    </div>
                    <h4>{slot.tache}</h4>
                    <p>{slot.conseil}</p>
                    <div className="tag-row">
                      <span>{slot.type}</span>
                      <span>{slot.methode}</span>
                      <span>{slot.duree_min} min</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="desktop-table-wrap">
          <table className="desktop-table">
            <colgroup>
              <col className="col-time" />
              <col className="col-task" />
              <col className="col-type" />
              <col className="col-method" />
              <col className="col-importance" />
              <col className="col-duration" />
              <col className="col-advice" />
            </colgroup>
            <thead>
              <tr>
                <th>Horaire</th>
                <th>Tache</th>
                <th>Type</th>
                <th>Methode</th>
                <th>Importance</th>
                <th>Duree</th>
                <th>Conseil</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <tr className="date-separator" key={`${group.key}-separator`}>
                    <th colSpan={7}>
                      {group.jour} <span>{group.date}</span>
                    </th>
                  </tr>
                  {group.slots.map((slot, index) => (
                    <tr className={`plan-row ${importanceTone(slot.importance)}`} key={`${slot.date}-${slot.heure_debut}-${slot.tache}-${index}`}>
                      <td className="time-cell">
                        {slot.heure_debut}
                        <span>{slot.heure_fin}</span>
                      </td>
                      <td className="task-cell">{slot.tache}</td>
                      <td>
                        <span className="soft-tag">{slot.type}</span>
                      </td>
                      <td>
                        <span className="soft-tag blue">{slot.methode}</span>
                      </td>
                      <td>
                        <span className={`importance-badge ${importanceTone(slot.importance)}`}>{slot.importance}</span>
                      </td>
                      <td>{slot.duree_min} min</td>
                      <td className="advice-cell">{slot.conseil}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="support-grid">
        <section className="support-block advice-block" aria-labelledby="advice-title">
          <div className="section-head">
            <p className="eyebrow">A garder en tete</p>
            <h3 id="advice-title">Conseils generaux</h3>
          </div>
          <ul>
            {plan.conseils_generaux.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="support-block action-block" aria-labelledby="actions-title">
          <div className="section-head">
            <p className="eyebrow">Suite</p>
            <h3 id="actions-title">Actions</h3>
          </div>
          <div className="action-list">
            {availableActions.map((action) =>
              action === "export_pdf" ? (
                <PDFDownloadLink key={action} className="plan-pdf-action" document={<PlanPdfDocument plan={plan} />} fileName={pdfFileName}>
                  {({ loading }) => (loading ? "Preparation..." : ACTION_LABEL[action])}
                </PDFDownloadLink>
              ) : (
                <button
                  key={action}
                  type="button"
                  className="action-button"
                  onClick={() => runAction(action)}
                  disabled={isBusy || (action === "add_task" && !canAddTask) || (action === "regenerate" && !actions?.onRegenerate) || (action === "edit_task" && !actions?.onEditTask) || (action === "add_task" && !actions?.onAddTask)}
                >
                  {action === "add_task" && !canAddTask ? "Limite 15 taches" : ACTION_LABEL[action]}
                </button>
              )
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .plan-result {
          --shadow-soft: 0 12px 28px rgba(35, 28, 51, 0.08);
          --importance-low: #bfe3f4;
          --importance-medium: #d8c2ea;
          --importance-high: #7e3d5e;
          display: grid;
          gap: 18px;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        .result-intro {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: stretch;
          padding: clamp(16px, 3vw, 24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          color: #fff;
          background:
            radial-gradient(circle at 92% 8%, rgba(255, 255, 255, 0.22), transparent 28%),
            linear-gradient(135deg, #7e3d5e 0%, #92617d 34%, #6c7d99 66%, #2e8bbf 100%);
          box-shadow: 0 18px 38px rgba(35, 28, 51, 0.16);
          width: 100%;
        }

        .intro-copy {
          display: grid;
          align-content: center;
          gap: 8px;
          min-width: 0;
          padding-right: 8px;
        }

        .eyebrow,
        h2,
        h3,
        h4,
        p,
        dl {
          margin: 0;
        }

        .eyebrow {
          color: var(--bleu-ciel);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .result-intro .eyebrow {
          color: #ffe2e7;
        }

        h2 {
          color: #fff;
          font-size: clamp(22px, 4vw, 34px);
          overflow-wrap: anywhere;
        }

        .intro-text {
          max-width: 620px;
          color: rgba(255, 255, 255, 0.86);
          font-size: 14px;
          line-height: 1.45;
        }

        .synthesis-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .synthesis-grid div {
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(8px);
        }

        dt {
          color: rgba(255, 255, 255, 0.76);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        dd {
          margin: 3px 0 0;
          color: #fff;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .planning-section,
        .support-block {
          display: grid;
          gap: 12px;
          border: 1px solid var(--bordure);
          border-radius: 18px;
          background: #fff;
          box-shadow: var(--shadow-soft);
        }

        .planning-section {
          padding: 16px;
          width: 100%;
        }

        .section-head {
          display: grid;
          gap: 3px;
        }

        h3 {
          color: var(--plum);
          font-size: 17px;
        }

        .mobile-days {
          display: none;
        }

        .desktop-table-wrap {
          overflow-x: auto;
          border: 1px solid #eee7f2;
          border-radius: 14px;
        }

        .desktop-table {
          width: 100%;
          min-width: 1040px;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
        }

        .col-time {
          width: 10%;
        }

        .col-task {
          width: 20%;
        }

        .col-type {
          width: 10%;
        }

        .col-method {
          width: 14%;
        }

        .col-importance {
          width: 11%;
        }

        .col-duration {
          width: 8%;
        }

        .col-advice {
          width: 29%;
        }

        th,
        td {
          padding: 10px 9px;
          border-bottom: 1px solid #eee7f2;
          text-align: left;
          vertical-align: middle;
        }

        thead th {
          background: #fbf8fc;
          color: #627086;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .date-separator th {
          padding: 9px 10px;
          border-bottom: 0;
          background: #f6f0f6;
          color: var(--plum);
          font-size: 13px;
        }

        .date-separator span {
          color: #6f7890;
          font-weight: 700;
        }

        .plan-row {
          border-left: 5px solid var(--importance-medium);
          background: #fff;
        }

        .plan-row.low {
          border-left-color: var(--importance-low);
        }

        .plan-row.medium {
          border-left-color: var(--importance-medium);
        }

        .plan-row.high {
          border-left-color: var(--importance-high);
        }

        .plan-row:hover {
          background: #fdfbfc;
        }

        .time-cell {
          color: var(--plum);
          font-weight: 800;
        }

        .time-cell span {
          display: block;
          color: #69768b;
          font-weight: 700;
        }

        .task-cell {
          color: var(--texte);
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .advice-cell {
          color: #40516c;
          line-height: 1.35;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .soft-tag,
        .importance-badge,
        .tag-row span,
        :global(.plan-pdf-action),
        .action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
        }

        .soft-tag,
        .tag-row span {
          max-width: 100%;
          padding: 5px 8px;
          border: 1px solid #eadfeb;
          background: #f7f2f8;
          color: var(--plum);
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .soft-tag.blue {
          border-color: #d3e6f0;
          background: #eef8fc;
          color: var(--bleu-ciel);
        }

        .importance-badge {
          padding: 5px 8px;
          border: 1px solid transparent;
          font-size: 11px;
        }

        .importance-badge.high {
          border-color: #d8b4c5;
          background: #f8eef3;
          color: #7e3d5e;
        }

        .importance-badge.medium {
          border-color: #d8c2ea;
          background: #f6f0fb;
          color: #745197;
        }

        .importance-badge.low {
          border-color: #bfe3f4;
          background: #eef8fc;
          color: #22769f;
        }

        .support-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.42fr);
          gap: 18px;
          align-items: start;
        }

        .support-block {
          padding: 16px;
        }

        ul {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
          color: #40516c;
          font-size: 14px;
        }

        li {
          position: relative;
          padding-left: 18px;
        }

        li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.62em;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--rose-pale);
        }

        .action-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        :global(.plan-pdf-action),
        .action-button {
          min-height: 42px;
          min-width: 132px;
          width: auto;
          border: 1px solid #d6c8dd;
          background: #fff;
          color: var(--plum);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          text-decoration: none;
          transition:
            transform 120ms ease,
            border-color 120ms ease,
            background 120ms ease;
        }

        :global(.plan-pdf-action) {
          border-color: transparent;
          background: #8b4e6e;
          color: #fff;
          box-shadow: 0 10px 22px rgba(139, 78, 110, 0.22);
          min-width: 150px;
        }

        :global(.plan-pdf-action:hover),
        .action-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: var(--bleu-ciel);
          background: #f4fbff;
        }

        :global(.plan-pdf-action:hover) {
          background: #713454;
          color: #fff;
        }

        .action-button:disabled {
          cursor: not-allowed;
          opacity: 0.52;
        }

        @media (max-width: 900px) {
          .result-intro,
          .support-grid {
            grid-template-columns: 1fr;
          }

          .synthesis-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .desktop-table-wrap {
            display: none;
          }

          .mobile-days {
            display: grid;
            gap: 12px;
          }

          .day-group {
            display: grid;
            gap: 10px;
          }

          .day-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 12px;
            background: #f6f0f6;
          }

          .day-heading strong {
            color: var(--plum);
            font-size: 14px;
          }

          .day-heading span {
            color: #69768b;
            font-size: 13px;
            font-weight: 700;
          }

          .slot-stack {
            display: grid;
            gap: 10px;
          }

          .slot-card {
            display: grid;
            gap: 9px;
            padding: 14px;
            border: 1px solid #eadfeb;
            border-left: 5px solid var(--importance-medium);
            border-radius: 14px;
            background:
              linear-gradient(135deg, rgba(247, 186, 193, 0.16), transparent 42%),
              #fff;
          }

          .slot-card.low {
            border-left-color: var(--importance-low);
          }

          .slot-card.medium {
            border-left-color: var(--importance-medium);
          }

          .slot-card.high {
            border-left-color: var(--importance-high);
          }

          .slot-topline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .slot-time {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            background: #f6f0f6;
            color: var(--plum);
            font-size: 13px;
            font-weight: 900;
          }

          h4 {
            color: var(--texte);
            font-size: 16px;
            overflow-wrap: anywhere;
          }

          .slot-card p {
            color: #40516c;
            font-size: 13px;
            line-height: 1.45;
          }

          .tag-row {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            min-width: 0;
          }
        }

        @media (max-width: 560px) {
          .synthesis-grid {
            grid-template-columns: 1fr;
          }

          .action-list,
          :global(.plan-pdf-action),
          .action-button {
            width: 100%;
          }

          .planning-section,
          .support-block {
            border-radius: 14px;
          }
        }
      `}</style>
    </section>
  );
}
