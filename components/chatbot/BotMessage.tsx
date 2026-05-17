"use client";

import type { PlannerResponse } from "@/lib/chatbot/planner-schema";

export function BotMessage({ message, plan }: { message: string; plan?: PlannerResponse }) {
  return (
    <article className="bot-message">
      <div className="bot-icon" aria-hidden="true"><span className="brand-logo" /></div>
      <div className="content">
        <p>{message}</p>
        {plan ? (
          <section className="plan-card" aria-label="Plan genere">
            <h4>{plan.objective}</h4>
            <small>{plan.timeframe}</small>
            {plan.planSections.map((section) => (
              <div key={section.title}><strong>{section.title}</strong><p>{section.description}</p><ul>{section.steps.map((step) => <li key={step}>{step}</li>)}</ul></div>
            ))}
            <div><strong>Aujourd&apos;hui</strong><ul>{plan.todayChecklist.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="week-grid">{plan.weeklyPlan.map((item) => <article key={item.day}><strong>{item.day}</strong><p>{item.focus}</p><ul>{item.tasks.map((task) => <li key={task}>{task}</li>)}</ul></article>)}</div>
            <div><strong>Habitudes</strong><ul>{plan.habits.map((habit) => <li key={habit}>{habit}</li>)}</ul></div>
            <div><strong>Risques</strong><ul>{plan.risks.map((risk) => <li key={risk.risk}>{risk.risk} - {risk.prevention}</li>)}</ul></div>
            <p className="next-action">Prochaine action: {plan.nextAction}</p>
            <p className="safety-note">{plan.safetyNote}</p>
          </section>
        ) : null}
      </div>
      <style jsx>{`
        .bot-message { display: flex; align-items: flex-start; gap: 10px; max-width: 100%; }
        .bot-icon { width: 28px; height: 28px; border-radius: 10px; border: 1px solid var(--bordure); display: grid; place-items: center; background: #fff; flex-shrink: 0; }
        .bot-icon :global(.brand-logo) { width: 14px; height: 14px; border-radius: 6px; }
        .content { display: grid; gap: 8px; width: min(100%, 760px); }
        p { margin: 0; max-width: min(100%, 740px); padding: 12px 14px; border-radius: 14px 14px 14px 4px; background: #f2eef8; border: 1px solid #e4d8ee; color: var(--texte); white-space: pre-wrap; }
        .plan-card { background: #fff; border: 1px solid #e4d8ee; border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
        .plan-card h4 { margin: 0; }
        .plan-card small { color: var(--texte-gris); }
        .plan-card ul { margin: 6px 0 0 16px; padding: 0; }
        .plan-card li { margin: 2px 0; }
        .plan-card strong { display: block; margin-top: 4px; }
        .week-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .week-grid article { border: 1px solid var(--bordure); border-radius: 10px; padding: 8px; background: #faf8fd; }
        .week-grid p { margin: 4px 0; padding: 0; border: 0; background: transparent; border-radius: 0; }
        .next-action { background: #eef9f1; border-color: #cde8d3; font-weight: 700; }
        .safety-note { font-size: 13px; color: var(--texte-gris); }
      `}</style>
    </article>
  );
}
