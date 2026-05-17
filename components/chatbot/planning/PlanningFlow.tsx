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
const STEP_BAR_COUNT = 3;

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

function stepPosition(step: Step): number {
  if (step === "setup") return 1;
  if (step === "tasks") return 2;
  if (step === "recap" || step === "loading" || step === "result") return 3;
  return 0;
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
  const activeStepPosition = stepPosition(step);

  const updateTask = (index: number, patch: Partial<TaskDraft>) => {
    setTasks((previous) => previous.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  };

  const stepBars = activeStepPosition ? (
    <div className="step-bars" aria-label={`Etape ${activeStepPosition} sur ${STEP_BAR_COUNT}`}>
      {Array.from({ length: STEP_BAR_COUNT }, (_, index) => (
        <span key={index} className={index < activeStepPosition ? "is-active" : undefined} />
      ))}
    </div>
  ) : null;

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
        <span className="header-badge">Planning IA</span>
      </header>

      <p className="safety-banner"><span aria-hidden="true">i</span>{SAFETY_MESSAGE}</p>

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
            <div>
              <p className="eyebrow">Etape 1</p>
              <h2 id="setup-title">Cadre global</h2>
            </div>
            {stepBars}
          </div>
          <div className="field-grid">
            <label className="field task-count-field">
              <span>Nombre de taches</span>
              <div className="counter-control">
                <button type="button" aria-label="Retirer une tache" onClick={() => setTaskCount((value) => Math.max(1, value - 1))} disabled={taskCount <= 1}>
                  -
                </button>
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
                <button type="button" aria-label="Ajouter une tache" onClick={() => setTaskCount((value) => Math.min(15, value + 1))} disabled={taskCount >= 15}>
                  +
                </button>
              </div>
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
            <div className="progress-stack">
              {stepBars}
              <div className="progress" aria-label={`Progression ${progress}%`}>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="task-fields">
            <label className="field">
              <span>Titre</span>
              <input value={currentTask.title} onChange={(event) => updateTask(currentTaskIndex, { title: event.target.value })} placeholder="Ex: rendre le dossier de psycho" />
            </label>
            <div className="field">
              <span>Type</span>
              <div className="type-chip-list" role="radiogroup" aria-label="Type de tache">
                {TASK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={currentTask.type === type ? "type-chip is-selected" : "type-chip"}
                    role="radio"
                    aria-checked={currentTask.type === type}
                    onClick={() => updateTask(currentTaskIndex, { type })}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Deadline de la tache</span>
              <input type="datetime-local" value={currentTask.deadline} onChange={(event) => updateTask(currentTaskIndex, { deadline: event.target.value })} />
            </label>
            <label className="field importance-field" htmlFor={fieldId(currentTaskIndex, "importance")}>
              <span className="range-label">
                <span>Importance</span>
                <strong>{currentTask.importance}/10</strong>
              </span>
              <input
                className="planning-range"
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
            <div className="recap-heading-actions">
              {stepBars}
              <button type="button" className="btn btn-tertiary" onClick={() => setStep("setup")}>
                Modifier le cadre
              </button>
            </div>
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
                    <dd>
                      <span className="importance-badge">{task.importance}/10</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Deadline</dt>
                    <dd>{task.deadline || "A completer"}</dd>
                  </div>
                </dl>
                <button type="button" className="edit-button" onClick={() => editTask(index)} aria-label={`Modifier la tache ${index + 1}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                    <path d="m14 8 2 2" />
                  </svg>
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

      <footer className="planning-footer">Confidentialite: les donnees servent uniquement a generer ton planning et les alertes de securite restent prioritaires.</footer>

      <style jsx>{`
        .planning-page {
          display: grid;
          gap: 20px;
          width: 100%;
          min-height: 100vh;
          align-content: start;
          padding: 40px 56px;
          overflow-x: hidden;
          background: #f7f4f8;
        }

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
          align-items: flex-start;
          gap: 24px;
          width: 100%;
          min-height: 205px;
          padding: 34px 38px;
          border-radius: 18px;
          background:
            radial-gradient(circle at 15% 20%, #8b4e6e 0%, transparent 35%),
            radial-gradient(circle at 85% 25%, #3a8db8 0%, transparent 38%),
            linear-gradient(135deg, #3d1f3d 0%, #4a5568 52%, #4a7f8c 100%);
          color: #fff;
          box-shadow: 0 18px 44px rgba(61, 31, 61, 0.16);
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid rgba(255, 255, 255, 0.34);
          border-radius: 999px;
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          font-size: 12px;
          font-weight: 700;
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
          color: #8b4e6e;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .planning-shell-header .eyebrow {
          color: rgba(255, 255, 255, 0.75);
          letter-spacing: 0.2em;
        }

        h1,
        h2,
        h3 {
          color: var(--plum);
        }

        .planning-shell-header h1 {
          color: #fff;
          font-size: clamp(2rem, 4vw, 2.6rem);
          font-weight: 300;
          margin-top: 12px;
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
          width: min(100%, 920px);
          padding: 18px 22px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
        }

        .safety-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid #e6ddd9;
          border-left: 4px solid #8b4e6e;
          background: #fafaf8;
          color: #4a5568;
          box-shadow: 0 8px 30px rgba(61, 31, 61, 0.06);
        }

        .safety-banner span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #8b4e6e;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          flex: 0 0 auto;
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
          width: 100%;
          min-height: 220px;
          margin: 0;
          padding: clamp(20px, 4vw, 34px);
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
          justify-self: center;
          width: min(100%, 720px);
          margin: 8px auto 0;
          padding: 32px;
          border-radius: 18px;
          border: 1px solid rgba(139, 78, 110, 0.12);
          box-shadow: 0 12px 40px rgba(61, 31, 61, 0.08);
        }

        .recap-panel {
          width: min(100%, 1120px);
        }

        .result-panel {
          width: min(100%, 1280px);
        }

        .step-heading {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 16px;
          padding-bottom: 18px;
          border-bottom: 1px solid #eee7ec;
        }

        .step-heading h2 {
          margin-top: 4px;
          color: #2d2d2d;
          font-size: 1.8rem;
          font-weight: 500;
        }

        .step-bars {
          display: grid;
          grid-template-columns: repeat(3, minmax(38px, 1fr));
          gap: 8px;
          width: min(220px, 38vw);
          padding-top: 6px;
        }

        .step-bars span {
          height: 8px;
          border-radius: 999px;
          background: #ece5f0;
          box-shadow: inset 0 0 0 1px rgba(126, 61, 94, 0.08);
        }

        .step-bars .is-active {
          background: linear-gradient(90deg, #f7bac1 0%, #8ec0c9 45%, #7e3d5e 100%);
        }

        .field-grid,
        .task-fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .form-panel .field-grid {
          align-items: end;
        }

        .field {
          display: grid;
          gap: 8px;
          min-width: 0;
          color: #2d2d2d;
          font-weight: 700;
        }

        .field span {
          color: #756a76;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        input,
        select {
          width: 100%;
          min-height: 52px;
          border: 1px solid #e6ddd9;
          border-radius: 12px;
          background: #fff;
          color: var(--texte);
          font: inherit;
          padding: 0 14px;
          outline: none;
        }

        input::placeholder {
          color: #8a92a1;
        }

        input:focus,
        select:focus {
          border-color: var(--bleu-ciel);
          box-shadow: 0 0 0 2px rgba(139, 78, 110, 0.28);
        }

        .counter-control {
          display: grid;
          grid-template-columns: 44px minmax(72px, 1fr) 44px;
          align-items: center;
          height: 52px;
          padding: 7px;
          border: 1px solid #e6ddd9;
          border-radius: 999px;
          background: #fff;
        }

        .counter-control input {
          min-height: 36px;
          border: 0;
          border-radius: 0;
          background: transparent;
          text-align: center;
          font-family: "Poppins", sans-serif;
          font-size: 1.35rem;
          font-weight: 600;
          color: #8b4e6e;
          padding: 0 8px;
        }

        .counter-control button {
          width: 36px;
          height: 36px;
          min-height: 36px;
          border: 0;
          border-radius: 999px;
          background: #8b4e6e;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 24px;
          font-weight: 800;
          transition: transform 120ms ease, opacity 120ms ease;
        }

        .counter-control button:active:not(:disabled),
        .type-chip:active,
        .btn:active:not(:disabled),
        .edit-button:active:not(:disabled) {
          transform: scale(0.96);
        }

        .counter-control button:disabled {
          background: #ded5df;
          color: #fff;
          cursor: not-allowed;
        }

        .range-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .range-label strong {
          min-width: 52px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #f5edf2;
          color: #8b4e6e;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
        }

        .planning-range {
          width: 100%;
          height: 8px;
          margin: 10px 0 16px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(90deg, #8ec0c9 0%, #f7bac1 55%, #8b4e6e 100%);
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .planning-range:focus-visible {
          box-shadow: 0 0 0 4px rgba(139, 78, 110, 0.18);
        }

        .planning-range::-webkit-slider-thumb {
          width: 18px;
          height: 18px;
          border: 3px solid #8b4e6e;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 2px 8px rgba(26, 26, 46, 0.16);
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }

        .planning-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: 3px solid #8b4e6e;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 2px 8px rgba(26, 26, 46, 0.16);
          cursor: pointer;
        }

        .planning-range::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, #8ec0c9 0%, #f7bac1 55%, #8b4e6e 100%);
        }

        .importance-field {
          grid-column: 1 / -1;
        }

        .type-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .type-chip {
          min-height: 40px;
          border: 1px solid #e6ddd9;
          border-radius: 999px;
          background: #fff;
          color: var(--texte-gris);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          padding: 9px 13px;
          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease,
            transform 140ms ease;
        }

        .type-chip:hover {
          transform: translateY(-1px);
          border-color: #cbbbd4;
        }

        .type-chip.is-selected {
          border-color: #8b4e6e;
          background: #8b4e6e;
          color: #fff;
          box-shadow: 0 8px 18px rgba(139, 78, 110, 0.18);
        }

        .progress-stack {
          display: grid;
          gap: 10px;
          justify-items: end;
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
          gap: 12px;
          flex-wrap: wrap;
        }

        .actions :global(.btn),
        .welcome-panel :global(.btn) {
          min-height: 46px;
          height: 44px;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }

        .actions :global(.btn-primary),
        .welcome-panel :global(.btn-primary) {
          min-width: 140px;
          background: #8b4e6e;
        }

        .actions :global(.btn-primary:hover:not(:disabled)),
        .welcome-panel :global(.btn-primary:hover:not(:disabled)) {
          transform: translateY(-1px);
          background: #713454;
          box-shadow: 0 10px 22px rgba(139, 78, 110, 0.22);
        }

        .actions :global(.btn-tertiary) {
          min-width: 120px;
          border-color: #8b4e6e;
          color: #8b4e6e;
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

        .recap-heading-actions {
          display: grid;
          justify-items: end;
          gap: 10px;
        }

        .task-card {
          display: grid;
          gap: 12px;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 14px;
          background: linear-gradient(180deg, #fff 0%, var(--fond-creme) 100%);
          box-shadow: 0 12px 24px rgba(35, 28, 51, 0.06);
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

        .importance-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          min-height: 26px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f7bac1, #7e3d5e);
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .edit-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
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

        .edit-button svg {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2;
        }

        .loading-panel {
          place-items: center;
          width: min(calc(100% - 32px), 560px);
          min-height: 230px;
          margin: 0 clamp(16px, 3vw, 24px);
          padding: 24px;
          text-align: center;
        }

        .loading-panel p {
          color: var(--texte-gris);
        }

        .spinner {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: conic-gradient(from 180deg, #8ec0c9, #f7bac1, #7e3d5e, #8ec0c9);
          box-shadow: 0 0 0 10px rgba(126, 61, 94, 0.06);
          animation: pulse-spin 1400ms ease-in-out infinite;
        }

        .spinner::after {
          content: "";
          position: absolute;
          inset: 9px;
          border-radius: inherit;
          background: #fff;
        }

        @keyframes pulse-spin {
          0%,
          100% {
            transform: rotate(0deg) scale(0.94);
            opacity: 0.82;
          }

          50% {
            transform: rotate(180deg) scale(1);
            opacity: 1;
          }
        }

        .planning-footer {
          width: 100%;
          padding: 4px 0 0;
          color: #8a7f89;
          font-size: 0.75rem;
          font-style: italic;
          line-height: 1.4;
          text-align: center;
        }

        @media (max-width: 760px) {
          .planning-page {
            padding: 16px;
          }

          .safety-banner,
          .form-error,
          .welcome-panel,
          .form-panel,
          .recap-panel,
          .result-panel,
          .loading-panel {
            width: 100%;
            margin-left: 0;
            margin-right: 0;
          }

          .planning-shell-header {
            min-height: 190px;
            padding: 26px 22px;
          }

          .welcome-panel,
          .field-grid,
          .task-fields {
            grid-template-columns: 1fr;
          }

          .step-heading {
            display: grid;
          }

          .step-bars,
          .progress {
            width: 100%;
          }

          .progress-stack,
          .recap-heading-actions {
            width: 100%;
            justify-items: stretch;
          }

          .actions {
            justify-content: stretch;
          }

          .actions :global(.btn),
          .welcome-panel :global(.btn) {
            width: 100%;
          }

          .counter-control {
            grid-template-columns: 44px minmax(64px, 1fr) 44px;
          }
        }
      `}</style>
    </div>
  );
}
