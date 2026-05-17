"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ResourceDetail, ResourceSection } from "@/lib/data/resources";

const CATEGORY_CLASS: Record<string, string> = {
  Stress: "stress",
  Sommeil: "sommeil",
  Organisation: "organisation",
  Examens: "examens",
};

function categoryClass(category: string): string {
  return CATEGORY_CLASS[category] || "stress";
}

function BreathingExercise() {
  const phases = useMemo(
    () => [
      { name: "Inspire", seconds: 4, className: "phase-inspire" },
      { name: "Retiens", seconds: 7, className: "phase-hold" },
      { name: "Expire", seconds: 8, className: "phase-expire" },
    ],
    []
  );
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (cycle >= 4) return;
    const timer = window.setTimeout(
      () => {
        if (seconds > 0) {
          setSeconds((value) => value - 1);
          return;
        }

        if (phaseIndex < phases.length - 1) {
          const next = phaseIndex + 1;
          setPhaseIndex(next);
          setSeconds(phases[next].seconds);
          return;
        }

        setCycle((value) => value + 1);
        setPhaseIndex(0);
        setSeconds(phases[0].seconds);
      },
      seconds > 0 ? 1000 : 0
    );
    return () => window.clearTimeout(timer);
  }, [cycle, phaseIndex, phases, running, seconds]);

  const finished = running && cycle >= 4;
  const phase = phases[phaseIndex];

  function start() {
    setRunning(true);
    setCycle(0);
    setPhaseIndex(0);
    setSeconds(phases[0].seconds);
  }

  function reset() {
    setRunning(false);
    setCycle(0);
    setPhaseIndex(0);
    setSeconds(0);
  }

  return (
    <div className="breath-stage">
      <div className="breath-circle-wrap">
        <div className="breath-ring" />
        <div className="breath-ring r2" />
        <div className="breath-ring r3" />
        <div className={`breath-circle ${running && !finished ? "is-playing" : ""} ${running && !finished ? phase.className : ""}`}>
          <div className="breath-phase-label">{finished ? "Bravo" : running ? phase.name : "Prêt·e ?"}</div>
          <div className="breath-counter">{finished ? "Fini" : running ? seconds : "4·7·8"}</div>
        </div>
      </div>
      <p className="breath-cycle-info">
        Cycle <strong>{Math.min(cycle + (running && !finished ? 1 : 0), 4)}</strong> / 4 · Durée totale ~ <strong>1 min 16</strong>
      </p>
      <div className="breath-controls">
        {!running || finished ? (
          <button className="round-btn primary" type="button" onClick={start}>
            {finished ? "Recommencer" : "Commencer l'exercice"}
          </button>
        ) : (
          <button className="round-btn ghost" type="button" onClick={reset}>
            Recommencer
          </button>
        )}
      </div>
      <div className="breath-progress" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={index < cycle || finished ? "done" : index === cycle && running ? "current" : ""} />
        ))}
      </div>
    </div>
  );
}

function PomodoroTimer() {
  const durations = { work: 25 * 60, break: 5 * 60, longBreak: 20 * 60 };
  const [state, setState] = useState<"idle" | "work" | "break" | "longBreak" | "paused">("idle");
  const [previous, setPrevious] = useState<"work" | "break" | "longBreak">("work");
  const [secondsLeft, setSecondsLeft] = useState(durations.work);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!["work", "break", "longBreak"].includes(state)) return;
    const timer = window.setTimeout(() => {
      if (secondsLeft > 0) {
        setSecondsLeft((value) => value - 1);
        return;
      }

      if (state === "work") {
        const nextCompleted = completed + 1;
        setCompleted(nextCompleted);
        setState(nextCompleted >= 4 ? "longBreak" : "break");
        setSecondsLeft(nextCompleted >= 4 ? durations.longBreak : durations.break);
        return;
      }

      setState("work");
      setSecondsLeft(durations.work);
      if (state === "longBreak") setCompleted(0);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [completed, durations.break, durations.longBreak, durations.work, secondsLeft, state]);

  const effective = state === "paused" ? previous : state === "idle" ? "work" : state;
  const duration = durations[effective];
  const progress = state === "idle" ? 0 : 1 - secondsLeft / duration;
  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const seconds = Math.max(secondsLeft, 0) % 60;
  const label = state === "paused" ? "En pause" : effective === "work" ? "Focus" : effective === "break" ? "Pause" : "Pause longue";

  function start() {
    if (state === "idle") {
      setState("work");
      setPrevious("work");
      setSecondsLeft(durations.work);
      return;
    }
    if (state === "paused") setState(previous);
  }

  function pause() {
    if (["work", "break", "longBreak"].includes(state)) {
      setPrevious(state as "work" | "break" | "longBreak");
      setState("paused");
    }
  }

  function reset() {
    setState("idle");
    setPrevious("work");
    setSecondsLeft(durations.work);
    setCompleted(0);
  }

  return (
    <div className={`pomodoro-visual ${state !== "idle" && state !== "paused" ? "is-running" : ""}`}>
      <div className="pomodoro-clock-wrap">
        <svg className="pomodoro-clock-svg" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id="pomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7E3D5E" />
              <stop offset="55%" stopColor="#5F6F8D" />
              <stop offset="100%" stopColor="#2E8BBF" />
            </linearGradient>
          </defs>
          <circle className="pom-clock-bg" cx="100" cy="100" r="90" />
          <circle className="pom-clock-fill" cx="100" cy="100" r="90" style={{ strokeDashoffset: 565.48 * (1 - progress) }} />
        </svg>
        <div className="pomodoro-clock-center">
          <div className="pom-time">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="pom-label">{label}</div>
        </div>
      </div>
      <div className="pomodoro-controls">
        {state === "idle" || state === "paused" ? (
          <button className="round-btn primary" type="button" onClick={start}>
            {state === "paused" ? "Reprendre" : "Démarrer"}
          </button>
        ) : (
          <button className="round-btn primary" type="button" onClick={pause}>
            Pause
          </button>
        )}
        <button className="round-btn ghost" type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="pom-dots-row">
        <span>Cycle :</span>
        <span className="pom-dots">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={`${index < completed ? "done" : ""} ${index === completed && state === "work" ? "active" : ""}`} />
          ))}
        </span>
        <span>{completed} / 4 pomodoros</span>
      </div>
      <div className="pomodoro-cycle">
        <div className={effective === "work" ? "pom-step is-current" : "pom-step"}>
          <strong>25 min</strong>Travail
        </div>
        <div className={effective === "break" ? "pom-step is-current" : "pom-step"}>
          <strong>5 min</strong>Pause
        </div>
        <div className="pom-step">
          <strong>25 min</strong>Travail
        </div>
        <div className={effective === "longBreak" ? "pom-step is-current" : "pom-step"}>
          <strong>15-30 min</strong>Pause longue
        </div>
      </div>
    </div>
  );
}

function Checklist({ items }: { items: Array<{ title: string; content: string }> }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  return (
    <ul className="checklist">
      {items.map((item, index) => {
        const isChecked = checked.has(index);
        return (
          <li key={`${item.title}-${index}`} className={isChecked ? "checked" : ""}>
            <button
              type="button"
              onClick={() => {
                setChecked((current) => {
                  const next = new Set(current);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                });
              }}
              aria-pressed={isChecked}
            >
              <span className="checklist-box" aria-hidden="true" />
              <span className="checklist-text">
                <strong>{item.title}</strong> {item.content}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RenderSection({ section }: { section: ResourceSection }) {
  if (section.kind === "breathing") return <BreathingExercise />;
  if (section.kind === "pomodoro") return <PomodoroTimer />;
  if (section.kind === "intro") return <div className="intro-box">{section.content}</div>;
  if (section.kind === "heading") return <h2>{section.title}</h2>;
  if (section.kind === "paragraph") return <p>{section.content}</p>;
  if (section.kind === "stat") {
    return (
      <div className="key-stat">
        <div className="key-stat-num">{section.value}</div>
        <div className="key-stat-txt">
          <strong>{section.title}</strong>
          {section.content} {section.tag ? <span className="science-tag">{section.tag}</span> : null}
        </div>
      </div>
    );
  }
  if (section.kind === "tips") {
    return (
      <ul className="tips-list">
        {section.items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong> {item.content}
          </li>
        ))}
      </ul>
    );
  }
  if (section.kind === "warning") {
    return (
      <div className="warning-box">
        <strong>{section.title}</strong>
        {section.content}
      </div>
    );
  }
  if (section.kind === "remember") {
    return (
      <div className="aretenir">
        <div className="aretenir-label">À retenir</div>
        <p>{section.content}</p>
      </div>
    );
  }
  if (section.kind === "breathingPhases") {
    return (
      <div className="phases-grid">
        <div className="phase-card">
          <div className="phase-num n4">4</div>
          <div className="phase-name">Inspire</div>
          <div className="phase-sec">par le nez · 4 sec</div>
        </div>
        <div className="phase-card">
          <div className="phase-num n7">7</div>
          <div className="phase-name">Retiens</div>
          <div className="phase-sec">poumons pleins · 7 sec</div>
        </div>
        <div className="phase-card">
          <div className="phase-num n8">8</div>
          <div className="phase-name">Expire</div>
          <div className="phase-sec">par la bouche · 8 sec</div>
        </div>
      </div>
    );
  }
  if (section.kind === "benefits") {
    return (
      <ul className="benefit-list">
        {section.items.map((item) => (
          <li key={item.content}>
            <span aria-hidden="true">✓</span>
            {item.content}
          </li>
        ))}
      </ul>
    );
  }
  if (section.kind === "steps") {
    return (
      <ol className="steps-numbered">
        {section.items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            {item.content}
          </li>
        ))}
      </ol>
    );
  }
  if (section.kind === "pauseTips") {
    return (
      <div className="pause-tips">
        <div className="pause-tip do">✓ Lève-toi, bouge, bois de l&apos;eau.</div>
        <div className="pause-tip do">✓ Regarde au loin et étire-toi.</div>
        <div className="pause-tip dont">× Pas de réseaux sociaux.</div>
        <div className="pause-tip dont">× Pas d&apos;écran intensif.</div>
      </div>
    );
  }
  if (section.kind === "oralPhase") {
    return (
      <>
        <div className="phase-banner">
          <div className="phase-banner-icon">{section.icon}</div>
          <div className="phase-banner-txt">
            <h3>{section.title}</h3>
            <span>{section.subtitle}</span>
          </div>
        </div>
        {section.items.length > 0 ? <Checklist items={section.items} /> : null}
      </>
    );
  }
  if (section.kind === "emergency") {
    return (
      <div className="emergency-card">
        <h3>{section.title}</h3>
        <p>{section.content}</p>
        <div className="quote">« {section.quote} »</div>
        <p>{section.footer}</p>
      </div>
    );
  }
  return null;
}

export function ResourceDetailView({ resource, resources }: { resource: ResourceDetail; resources: ResourceDetail[] }) {
  const tone = categoryClass(resource.category);
  const related = resource.related
    .map((slug) => resources.find((item) => item.slug === slug))
    .filter((item): item is ResourceDetail => Boolean(item));

  return (
    <article className="resource-detail">
      <header className="fiche-header">
        <Link className="fiche-back" href="/resources">
          ‹ Retour aux ressources
        </Link>
        <div className="fiche-header-actions" aria-hidden="true">
          <span className="icon-btn">☆</span>
          <span className="icon-btn">↗</span>
        </div>
      </header>

      <section className="fiche-hero">
        <div className="fiche-hero-content">
          <div className={`fiche-thumb-big thumb-${tone}`}>{resource.icon}</div>
          <span className={`badge badge-${tone}`}>{resource.category}</span>
          <h1>{resource.title}</h1>
          <p className="fiche-hero-desc">{resource.description}</p>
          <div className="fiche-meta">
            <span>{resource.type}</span>
            <span className="dot" />
            <span>{resource.duration.includes("min") ? resource.duration : `${resource.duration} de lecture`}</span>
            <span className="dot" />
            <span>{resource.type === "Fiche pratique" ? "Checklist interactive" : "Validé par Emotion Lab"}</span>
          </div>
        </div>
      </section>

      <div className="fiche-body">
        <div className="fiche-body-main">
          {resource.sections.map((section, index) => (
            <RenderSection key={`${section.kind}-${index}`} section={section} />
          ))}

          <section className="related-section">
            <h3>À découvrir ensuite</h3>
            <div className="related-grid">
              {related.map((item) => (
                <Link key={item.slug} className="related-card" href={`/resources/${item.slug}`}>
                  <div className={`related-thumb thumb-${categoryClass(item.category)}`}>{item.icon}</div>
                  <div className="related-info">
                    <div className="related-cat">{item.category}</div>
                    <div className="related-title">{item.title}</div>
                    <div className="related-meta">
                      {item.type} · {item.duration}
                    </div>
                  </div>
                  <span className="related-arrow">›</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="toc-sidebar">
          <h4>{resource.type === "Article" ? "Dans cet article" : "Dans cette fiche"}</h4>
          <ul>
            {resource.toc.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>

      <style jsx>{`
        .resource-detail {
          margin: -18px;
          min-height: calc(100vh - 36px);
          background: #fdfbfc;
          color: var(--texte);
        }

        .fiche-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(253, 251, 252, 0.94);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--bordure);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
        }

        .fiche-back {
          color: var(--texte-gris);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .fiche-header-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--texte-gris);
          background: var(--fond-lavande);
        }

        .fiche-hero {
          position: relative;
          padding: 34px 20px 36px;
          overflow: hidden;
        }

        .fiche-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 82% 0%, rgba(242, 173, 178, 0.18), transparent 58%),
            radial-gradient(circle at 0% 100%, rgba(142, 192, 201, 0.16), transparent 52%);
        }

        .fiche-hero-content {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
        }

        .fiche-thumb-big {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          margin-bottom: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .thumb-stress {
          background: linear-gradient(135deg, #f7bac1, #f2adb2);
        }

        .thumb-sommeil {
          background: linear-gradient(135deg, #e8e0f2, #c9b8dd);
        }

        .thumb-organisation {
          background: linear-gradient(135deg, #ffd3c2, #ffb39a);
        }

        .thumb-examens {
          background: linear-gradient(135deg, #c9deeb, #a4c7dc);
        }

        .badge {
          display: inline-flex;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .badge-stress {
          background: #f7bac1;
          color: #8b3a52;
        }

        .badge-sommeil {
          background: #e8e0f2;
          color: #5d4a8a;
        }

        .badge-organisation {
          background: #ffe0d6;
          color: #b85138;
        }

        .badge-examens {
          background: #d9ebf5;
          color: #1f5d80;
        }

        .fiche-hero h1 {
          margin: 10px 0;
          font-size: clamp(28px, 4vw, 38px);
          line-height: 1.15;
        }

        .fiche-hero-desc {
          max-width: 720px;
          margin: 0;
          color: var(--texte-gris);
          line-height: 1.6;
        }

        .fiche-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 14px;
          margin-top: 18px;
          color: var(--texte-clair);
          font-size: 13px;
        }

        .dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
        }

        .fiche-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 20px 42px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 48px;
          align-items: start;
        }

        .fiche-body-main {
          min-width: 0;
        }

        .fiche-body-main :global(p) {
          color: var(--texte-gris);
          line-height: 1.7;
          margin: 0 0 14px;
        }

        .fiche-body-main :global(h2) {
          margin: 30px 0 12px;
          font-size: 22px;
        }

        .intro-box,
        .aretenir,
        .warning-box,
        .key-stat,
        .pomodoro-visual,
        .breath-stage,
        .emergency-card {
          border-radius: 16px;
        }

        .intro-box {
          background: var(--fond-lavande);
          border-left: 3px solid var(--plum);
          padding: 18px 20px;
          margin: 6px 0 28px;
          color: var(--texte-gris);
          font-style: italic;
        }

        .aretenir {
          margin-top: 32px;
          background: linear-gradient(135deg, rgba(126, 61, 94, 0.04), rgba(46, 139, 191, 0.06));
          border: 1px solid var(--bordure);
          padding: 22px;
        }

        .aretenir-label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--plum);
          margin-bottom: 10px;
        }

        .warning-box {
          background: #fffaf0;
          border-left: 3px solid #ed8936;
          padding: 14px 16px;
          margin: 18px 0;
          color: #7a4a1f;
        }

        .warning-box strong {
          display: block;
          color: #c16518;
          margin-bottom: 4px;
        }

        .toc-sidebar {
          position: sticky;
          top: 82px;
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 14px;
          padding: 18px;
        }

        .toc-sidebar h4 {
          margin: 0 0 12px;
          color: var(--texte-clair);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .toc-sidebar ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .toc-sidebar li {
          padding: 7px 10px;
          color: var(--texte-gris);
          font-size: 13px;
          border-left: 2px solid transparent;
        }

        .related-section {
          background: var(--fond-lavande);
          border: 1px solid var(--bordure);
          border-radius: 16px;
          margin-top: 36px;
          padding: 24px;
        }

        .related-section h3 {
          margin: 0 0 14px;
          color: var(--texte-clair);
          font-size: 13px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .related-grid {
          display: grid;
          gap: 10px;
        }

        .related-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 12px;
          padding: 12px;
          color: inherit;
          text-decoration: none;
          transition: all 150ms ease;
        }

        .related-card:hover {
          transform: translateX(4px);
          border-color: var(--lavande);
        }

        .related-thumb {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .related-info {
          min-width: 0;
          flex: 1;
        }

        .related-cat {
          color: var(--plum);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .related-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 700;
        }

        .related-meta {
          color: var(--texte-clair);
          font-size: 12px;
        }

        @media (max-width: 920px) {
          .resource-detail {
            margin: -14px;
          }

          .fiche-body {
            display: block;
          }

          .toc-sidebar {
            display: none;
          }
        }
      `}</style>
      <style jsx global>{`
        .breath-stage {
          background: linear-gradient(180deg, #fdfbfc 0%, #f5f0f7 100%);
          border: 1px solid var(--bordure);
          padding: 36px 20px 28px;
          margin: 8px 0 24px;
          text-align: center;
          overflow: hidden;
        }

        .breath-circle-wrap {
          position: relative;
          width: 240px;
          height: 240px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .breath-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from -90deg, #7e3d5e, #8a6889, #5f6f8d, #2e8bbf, #7e3d5e);
          opacity: 0.12;
        }

        .breath-ring.r2 {
          inset: 18px;
          opacity: 0.2;
        }

        .breath-ring.r3 {
          inset: 36px;
          opacity: 0.3;
        }

        .breath-circle {
          position: relative;
          width: 144px;
          height: 144px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7e3d5e 0%, #8a6889 33%, #5f6f8d 66%, #2e8bbf 100%);
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 36px rgba(126, 61, 94, 0.35);
          transition: transform 4s ease-in-out;
        }

        .breath-circle.phase-inspire,
        .breath-circle.phase-hold {
          transform: scale(1.45);
        }

        .breath-circle.phase-expire {
          transform: scale(1);
          transition-duration: 8s;
        }

        .breath-phase-label {
          font-weight: 700;
          font-size: 18px;
        }

        .breath-counter {
          font-weight: 800;
          font-size: 42px;
          line-height: 1;
        }

        .breath-cycle-info {
          text-align: center;
          font-size: 13px;
          color: var(--texte-clair);
        }

        .round-btn {
          border: 0;
          border-radius: 999px;
          padding: 13px 24px;
          font-weight: 700;
          cursor: pointer;
        }

        .round-btn.primary {
          background: var(--plum);
          color: #fff;
        }

        .round-btn.ghost {
          background: #fff;
          border: 1px solid var(--bordure);
          color: var(--texte-gris);
        }

        .breath-progress {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-top: 18px;
        }

        .breath-progress span {
          width: 32px;
          height: 6px;
          border-radius: 3px;
          background: var(--bordure);
        }

        .breath-progress .done,
        .breath-progress .current {
          background: var(--plum);
        }

        .phases-grid,
        .pause-tips {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 24px 0;
        }

        .phase-card,
        .pause-tip,
        .tips-list li,
        .benefit-list li,
        .steps-numbered li {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 14px;
          padding: 14px;
        }

        .phase-card {
          text-align: center;
        }

        .phase-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .n4 {
          background: var(--plum);
        }

        .n7 {
          background: var(--lavande);
        }

        .n8 {
          background: var(--bleu-ciel);
        }

        .phase-name {
          font-weight: 800;
          margin-top: 8px;
        }

        .phase-sec {
          color: var(--texte-clair);
          font-size: 12px;
        }

        .benefit-list,
        .tips-list,
        .steps-numbered {
          list-style: none;
          padding: 0;
          margin: 14px 0;
          display: grid;
          gap: 10px;
        }

        .benefit-list li {
          display: flex;
          gap: 10px;
          color: var(--texte-gris);
        }

        .benefit-list span {
          color: var(--succes);
          font-weight: 900;
        }

        .key-stat {
          background: linear-gradient(135deg, rgba(46, 139, 191, 0.08), rgba(142, 192, 201, 0.12));
          border: 1px solid rgba(46, 139, 191, 0.15);
          padding: 20px;
          display: flex;
          gap: 18px;
          align-items: center;
          margin: 18px 0;
        }

        .key-stat-num {
          font-size: 42px;
          font-weight: 900;
          color: var(--bleu-ciel);
        }

        .science-tag {
          display: inline-flex;
          margin-left: 6px;
          color: var(--bleu-ciel);
          background: rgba(46, 139, 191, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
        }

        .pomodoro-visual {
          background: #fff;
          border: 1px solid var(--bordure);
          padding: 24px;
          margin: 16px 0 24px;
          text-align: center;
        }

        .pomodoro-clock-wrap {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 18px;
        }

        .pomodoro-clock-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .pom-clock-bg,
        .pom-clock-fill {
          fill: none;
          stroke-width: 14;
        }

        .pom-clock-bg {
          stroke: var(--bordure);
        }

        .pom-clock-fill {
          stroke: url(#pomGrad);
          stroke-linecap: round;
          stroke-dasharray: 565.48;
          transition: stroke-dashoffset 1s linear;
        }

        .pomodoro-clock-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .pom-time {
          font-size: 44px;
          font-weight: 900;
          line-height: 1;
        }

        .pom-label {
          color: var(--texte-clair);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pomodoro-controls,
        .pom-dots-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 12px 0;
        }

        .pom-dots {
          display: flex;
          gap: 7px;
        }

        .pom-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--bordure);
        }

        .pom-dots .done,
        .pom-dots .active {
          background: var(--plum);
        }

        .pomodoro-cycle {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .pom-step {
          border: 1px solid var(--bordure);
          border-radius: 10px;
          background: var(--fond-lavande);
          padding: 10px 8px;
          color: var(--texte-gris);
          font-size: 11px;
        }

        .pom-step strong {
          display: block;
          color: var(--plum);
          font-size: 13px;
        }

        .pom-step.is-current {
          background: linear-gradient(135deg, #7e3d5e, #5f6f8d, #2e8bbf);
          color: #fff;
          border-color: transparent;
        }

        .pom-step.is-current strong {
          color: #fff;
        }

        .steps-numbered {
          counter-reset: step;
        }

        .steps-numbered li {
          counter-increment: step;
          position: relative;
          padding-left: 58px;
        }

        .steps-numbered li::before {
          content: counter(step);
          position: absolute;
          left: 16px;
          top: 14px;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7e3d5e, #2e8bbf);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .pause-tips {
          grid-template-columns: 1fr 1fr;
        }

        .pause-tip.do {
          color: #2f855a;
        }

        .pause-tip.dont {
          color: #c53030;
        }

        .phase-banner {
          background: linear-gradient(135deg, rgba(46, 139, 191, 0.06), rgba(142, 192, 201, 0.1));
          border: 1px solid rgba(46, 139, 191, 0.12);
          border-radius: 14px;
          padding: 14px 18px;
          margin: 18px 0 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .phase-banner-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .phase-banner-txt h3 {
          margin: 0;
          font-size: 15px;
        }

        .phase-banner-txt span {
          color: var(--texte-clair);
          font-size: 12px;
        }

        .checklist {
          list-style: none;
          padding: 0;
          margin: 12px 0 22px;
          display: grid;
          gap: 8px;
        }

        .checklist button {
          width: 100%;
          border: 1px solid var(--bordure);
          border-radius: 12px;
          background: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }

        .checklist-box {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          border: 2px solid var(--bordure);
          flex: 0 0 auto;
        }

        .checklist .checked .checklist-box {
          background: var(--plum);
          border-color: var(--plum);
          box-shadow: inset 0 0 0 4px #fff;
        }

        .checklist .checked .checklist-text {
          color: var(--texte-clair);
          text-decoration: line-through;
        }

        .emergency-card {
          background: linear-gradient(135deg, #fff8f5, #fff);
          border: 1.5px solid var(--corail);
          padding: 18px;
          margin: 20px 0;
        }

        .emergency-card h3 {
          color: var(--plum);
          margin: 0 0 6px;
        }

        .quote {
          margin: 10px 0;
          padding: 10px 14px;
          background: #fff;
          border-radius: 10px;
          border-left: 3px solid var(--corail);
          color: var(--plum);
          font-style: italic;
        }

        @media (max-width: 640px) {
          .phases-grid,
          .pause-tips,
          .pomodoro-cycle {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </article>
  );
}
