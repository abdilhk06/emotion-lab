"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PlannerRequest, PlannerResponse } from "@/lib/chatbot/planner-schema";
import { PlanResult } from "@/components/chatbot/planning/PlanResult";

type Step = "welcome" | "setup" | "tasks" | "recap" | "loading" | "result";

type TaskDraft = {
  title: string;
  type: string;
  importance: number;
  deadline: string;
};

const TASK_TYPES = ["Revision", "Rendu", "Lecture", "Exercice", "Projet", "Administratif"];
const SAFETY_MESSAGE = "Cet assistant cree un plan de travail personnalise. En cas d'urgence, contacte un service d'aide ou une personne de confiance.";

function localDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyTask(): TaskDraft {
  return {
    title: "",
    type: TASK_TYPES[0],
    importance: 5,
    deadline: "",
  };
}

function createTasks(count: number, previous: TaskDraft[] = []): TaskDraft[] {
  return Array.from({ length: count }, (_, index) => previous[index] ?? emptyTask());
}

function fieldId(index: number, field: string): string {
  return `task-${index}-${field}`;
}

export function PlanningFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [taskCount, setTaskCount] = useState(3);
  const [globalDeadline, setGlobalDeadline] = useState("");
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [tasks, setTasks] = useState<TaskDraft[]>(() => createTasks(3));
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const currentTask = tasks[currentTaskIndex] ?? emptyTask();
  const setupValid = taskCount >= 1 && taskCount <= 15 && globalDeadline.trim().length > 0;
  const currentTaskValid = currentTask.title.trim().length > 0 && currentTask.type.trim().length > 0 && currentTask.deadline.trim().length > 0;
  const allTasksValid = tasks.every((task) => task.title.trim() && task.type.trim() && task.deadline.trim() && task.importance >= 1 && task.importance <= 10);
  const progress = useMemo(() => Math.round(((currentTaskIndex + 1) / taskCount) * 100), [currentTaskIndex, taskCount]);

  const updateTask = (index: number, patch: Partial<TaskDraft>) => {
    setTasks((previous) => previous.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  };

  useEffect(() => {
    const guard = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setAuthChecked(true);
    };

    void guard();
  }, [router]);

  const goToSetup = () => {
    setError(null);
    setStep("setup");
  };

  const confirmSetup = () => {
    if (!setupValid) {
      setError("Choisis entre 1 et 15 taches et ajoute une deadline globale.");
      return;
    }

    setError(null);
    setTasks((previous) => createTasks(taskCount, previous));
    setCurrentTaskIndex(0);
    setStep("tasks");
  };

  const nextTask = () => {
    if (!currentTaskValid) {
      setError("Complete le titre, le type et la deadline de cette tache.");
      return;
    }

    setError(null);
    if (currentTaskIndex >= taskCount - 1) {
      setStep("recap");
      return;
    }

    setCurrentTaskIndex((value) => value + 1);
  };

  const previousTask = () => {
    setError(null);
    if (currentTaskIndex === 0) {
      setStep("setup");
      return;
    }
    setCurrentTaskIndex((value) => value - 1);
  };

  const editTask = (index: number) => {
    setError(null);
    setCurrentTaskIndex(index);
    setStep("tasks");
  };

  const addTaskFromPlan = () => {
    if (taskCount >= 15) {
      setError("La limite est de 15 taches.");
      return;
    }

    setError(null);
    setPlan(null);
    setTasks((previous) => [...previous, emptyTask()]);
    setCurrentTaskIndex(taskCount);
    setTaskCount((value) => value + 1);
    setStep("tasks");
  };

  const editFirstTaskFromPlan = () => {
    setPlan(null);
    editTask(0);
  };

  const buildPayload = (): PlannerRequest => ({
    taskCount,
    globalDeadline,
    todayDate: localDate(),
    tasks: tasks.map((task) => ({
      title: task.title.trim(),
      type: task.type.trim(),
      importance: String(task.importance),
      deadline: task.deadline,
    })),
  });

  const submitPlan = async () => {
    if (!setupValid || !allTasksValid || isSubmitting) {
      setError("Verifie les deadlines et les champs obligatoires avant de generer le plan.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setStep("loading");

    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/chatbot/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      const payload = await response.json();

      if (payload?.type === "alerte_securite") {
        router.push("/resources");
        return;
      }

      if (!response.ok || !payload?.plan) {
        throw new Error("api_error");
      }

      setPlan(payload.plan as PlannerResponse);
      setStep("result");
    } catch {
      setError("Le plan n'a pas pu etre genere. Reessaie apres avoir verifie tes informations.");
      setStep("recap");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="planning-page">
      <header className="planning-shell-header">
        <div>
          <p className="eyebrow">Emotion Bot</p>
          <h1>Planification guidee</h1>
        </div>
        <span className="brand-logo" aria-hidden="true" />
      </header>

      <p className="safety-banner">{SAFETY_MESSAGE}</p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!authChecked ? (
        <section className="loading-panel" aria-live="polite" aria-label="Chargement">
          <div className="spinner" aria-hidden="true" />
          <h2>Chargement...</h2>
        </section>
      ) : null}

      {authChecked && step === "welcome" ? (
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <p className="eyebrow">Planning structure</p>
            <h2 id="welcome-title">Transforme tes taches en sequence claire.</h2>
            <p>
              Entre le nombre de taches, leurs deadlines et leur importance. Le profil reste charge cote serveur par l&apos;API pour personnaliser le plan.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={goToSetup}>
            Commencer
          </button>
        </section>
      ) : null}

      {authChecked && step === "setup" ? (
        <section className="form-panel" aria-labelledby="setup-title">
          <div className="step-heading">
            <p className="eyebrow">Etape 1</p>
            <h2 id="setup-title">Cadre global</h2>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Nombre de taches</span>
              <input
                type="number"
                min={1}
                max={15}
                value={taskCount}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setTaskCount(Number.isFinite(value) ? Math.min(15, Math.max(1, value)) : 1);
                }}
              />
            </label>
            <label className="field">
              <span>Deadline globale</span>
              <input type="datetime-local" value={globalDeadline} onChange={(event) => setGlobalDeadline(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-tertiary" onClick={() => setStep("welcome")}>
              Retour
            </button>
            <button type="button" className="btn btn-primary" onClick={confirmSetup} disabled={!setupValid}>
              Continuer
            </button>
          </div>
        </section>
      ) : null}

      {authChecked && step === "tasks" ? (
        <section className="form-panel task-panel" aria-labelledby="task-title">
          <div className="step-heading">
            <div>
              <p className="eyebrow">Etape 2</p>
              <h2 id="task-title">
                Tache {currentTaskIndex + 1} sur {taskCount}
              </h2>
            </div>
            <div className="progress" aria-label={`Progression ${progress}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="task-fields">
            <label className="field">
              <span>Titre</span>
              <input value={currentTask.title} onChange={(event) => updateTask(currentTaskIndex, { title: event.target.value })} placeholder="Ex: rendre le dossier de psycho" />
            </label>
            <label className="field">
              <span>Type</span>
              <select value={currentTask.type} onChange={(event) => updateTask(currentTaskIndex, { type: event.target.value })}>
                {TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Deadline de la tache</span>
              <input type="datetime-local" value={currentTask.deadline} onChange={(event) => updateTask(currentTaskIndex, { deadline: event.target.value })} />
            </label>
            <label className="field importance-field" htmlFor={fieldId(currentTaskIndex, "importance")}>
              <span>Importance: {currentTask.importance}/10</span>
              <input
                id={fieldId(currentTaskIndex, "importance")}
                type="range"
                min={1}
                max={10}
                value={currentTask.importance}
                onChange={(event) => updateTask(currentTaskIndex, { importance: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="actions">
            <button type="button" className="btn btn-tertiary" onClick={previousTask}>
              Retour
            </button>
            <button type="button" className="btn btn-primary" onClick={nextTask} disabled={!currentTaskValid}>
              {currentTaskIndex >= taskCount - 1 ? "Voir le recap" : "Tache suivante"}
            </button>
          </div>
        </section>
      ) : null}

      {authChecked && step === "recap" ? (
        <section className="recap-panel" aria-labelledby="recap-title">
          <div className="step-heading">
            <div>
              <p className="eyebrow">Etape 3</p>
              <h2 id="recap-title">Recapitulatif editable</h2>
            </div>
            <button type="button" className="btn btn-tertiary" onClick={() => setStep("setup")}>
              Modifier le cadre
            </button>
          </div>
          <div className="recap-grid">
            {tasks.map((task, index) => (
              <article key={index} className="task-card">
                <div>
                  <p className="task-index">Tache {index + 1}</p>
                  <h3>{task.title || "Titre manquant"}</h3>
                </div>
                <dl>
                  <div>
                    <dt>Type</dt>
                    <dd>{task.type}</dd>
                  </div>
                  <div>
                    <dt>Importance</dt>
                    <dd>{task.importance}/10</dd>
                  </div>
                  <div>
                    <dt>Deadline</dt>
                    <dd>{task.deadline || "A completer"}</dd>
                  </div>
                </dl>
                <button type="button" className="edit-button" onClick={() => editTask(index)}>
                  Modifier
                </button>
              </article>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="btn btn-tertiary" onClick={() => editTask(taskCount - 1)}>
              Retour
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void submitPlan()} disabled={!allTasksValid || isSubmitting}>
              Generer le plan
            </button>
          </div>
        </section>
      ) : null}

      {authChecked && step === "loading" ? (
        <section className="loading-panel" aria-live="polite" aria-label="Generation du plan">
          <div className="spinner" aria-hidden="true" />
          <h2>Construction du planning...</h2>
          <p>Les taches, deadlines et priorites sont envoyees au format structure.</p>
        </section>
      ) : null}

      {authChecked && step === "result" && plan ? (
        <section className="result-panel" aria-labelledby="result-title">
          <div className="step-heading">
            <div>
              <p className="eyebrow">Resultat</p>
              <h2 id="result-title">Plan pret</h2>
            </div>
            <button type="button" className="btn btn-tertiary" onClick={() => setStep("recap")}>
              Ajuster
            </button>
          </div>
          <PlanResult
            plan={plan}
            actions={{
              onRegenerate: () => void submitPlan(),
              onEditTask: editFirstTaskFromPlan,
              onAddTask: addTaskFromPlan,
              canAddTask: taskCount < 15,
              isBusy: isSubmitting,
            }}
          />
        </section>
      ) : null}

      <style jsx>{`
        .planning-page {
          display: grid;
          gap: 14px;
          min-height: min(820px, calc(100vh - 150px));
        }

        .planning-shell-header,
        .welcome-panel,
        .form-panel,
        .recap-panel,
        .loading-panel,
        .result-panel {
          border: 1px solid var(--bordure);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 14px 34px rgba(35, 28, 51, 0.06);
        }

        .planning-shell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px;
          background:
            linear-gradient(115deg, rgba(242, 173, 178, 0.32), transparent 38%),
            linear-gradient(145deg, #fff 0%, var(--fond-lavande) 100%);
        }

        .planning-shell-header :global(.brand-logo) {
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
        }

        .eyebrow,
        h1,
        h2,
        h3,
        p,
        dl {
          margin: 0;
        }

        .eyebrow {
          color: var(--bleu-ciel);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3 {
          color: var(--plum);
        }

        h1 {
          font-size: clamp(24px, 4vw, 34px);
        }

        h2 {
          font-size: clamp(22px, 4vw, 30px);
        }

        .safety-banner,
        .form-error {
          margin: 0;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
        }

        .safety-banner {
          border: 1px solid #f0ccd2;
          background: #fff7f8;
          color: #7f2238;
        }

        .form-error {
          border: 1px solid #e9b4bf;
          background: #fff2f4;
          color: #8f263c;
        }

        .welcome-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 28px;
          min-height: 340px;
          padding: clamp(20px, 5vw, 42px);
          background:
            linear-gradient(135deg, rgba(126, 61, 94, 0.08), transparent 44%),
            linear-gradient(160deg, #fff 0%, #fdfbfc 52%, #f5f0f7 100%);
        }

        .welcome-copy {
          display: grid;
          gap: 12px;
          max-width: 680px;
        }

        .welcome-copy p:not(.eyebrow) {
          color: var(--texte-gris);
          font-size: 16px;
          max-width: 620px;
        }

        .form-panel,
        .recap-panel,
        .result-panel {
          display: grid;
          gap: 20px;
          padding: clamp(16px, 3vw, 24px);
        }

        .step-heading {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 16px;
        }

        .field-grid,
        .task-fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 8px;
          min-width: 0;
          color: var(--texte);
          font-weight: 700;
        }

        .field span {
          color: var(--texte-gris);
          font-size: 13px;
        }

        input,
        select {
          width: 100%;
          min-height: 48px;
          border: 1.5px solid var(--bordure);
          border-radius: 12px;
          background: var(--fond-creme);
          color: var(--texte);
          font: inherit;
          padding: 0 14px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: var(--bleu-ciel);
          box-shadow: 0 0 0 3px rgba(46, 139, 191, 0.14);
        }

        input[type="range"] {
          padding: 0;
          accent-color: var(--plum);
          background: transparent;
        }

        .importance-field {
          grid-column: 1 / -1;
        }

        .progress {
          width: min(240px, 40vw);
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--fond-lavande);
          border: 1px solid var(--bordure);
        }

        .progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--plum), var(--bleu-ciel));
          transition: width 180ms ease;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .actions :global(.btn),
        .welcome-panel :global(.btn) {
          min-height: 46px;
          cursor: pointer;
        }

        .actions :global(.btn:disabled),
        .welcome-panel :global(.btn:disabled) {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .recap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
        }

        .task-card {
          display: grid;
          gap: 12px;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 14px;
          background: linear-gradient(180deg, #fff 0%, var(--fond-creme) 100%);
        }

        .task-index {
          color: var(--bleu-ciel);
          font-size: 12px;
          font-weight: 800;
        }

        .task-card h3 {
          color: var(--texte);
          font-size: 17px;
          overflow-wrap: anywhere;
        }

        .task-card dl {
          display: grid;
          gap: 8px;
        }

        .task-card dl div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid var(--bordure);
          padding-top: 8px;
        }

        dt {
          color: var(--texte-clair);
          font-size: 12px;
          font-weight: 800;
        }

        dd {
          margin: 0;
          color: var(--texte);
          font-weight: 700;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .edit-button {
          justify-self: start;
          border: 1px solid #d7cbe0;
          border-radius: 999px;
          background: var(--fond-lavande);
          color: var(--plum);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          padding: 8px 12px;
        }

        .loading-panel {
          place-items: center;
          min-height: 360px;
          padding: 24px;
          text-align: center;
        }

        .loading-panel p {
          color: var(--texte-gris);
        }

        .spinner {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 5px solid var(--fond-lavande);
          border-top-color: var(--bleu-ciel);
          animation: spin 900ms linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .welcome-panel,
          .field-grid,
          .task-fields {
            grid-template-columns: 1fr;
          }

          .step-heading {
            display: grid;
          }

          .progress {
            width: 100%;
          }

          .actions {
            justify-content: stretch;
          }

          .actions :global(.btn),
          .welcome-panel :global(.btn) {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
