"use client";

type NotificationSettingsProps = {
  values: {
    buddyRequests: boolean;
    messages: boolean;
    chatbotReminders: boolean;
  };
  onChange: (next: { buddyRequests: boolean; messages: boolean; chatbotReminders: boolean }) => void;
};

export function NotificationSettings({ values, onChange }: NotificationSettingsProps) {
  return (
    <section className="settings-card">
      <div className="settings-card-head">
        <h2>Notifications</h2>
      </div>

      <div className="settings-row">
        <div>
          <h3>Nouvelles demandes Buddy</h3>
          <p>Recois une alerte par email.</p>
        </div>
        <label className="switch" aria-label="Nouvelles demandes Buddy">
          <input
            type="checkbox"
            checked={values.buddyRequests}
            onChange={(event) => onChange({ ...values, buddyRequests: event.target.checked })}
          />
          <span className="slider" />
        </label>
      </div>

      <div className="settings-row">
        <div>
          <h3>Nouveaux messages</h3>
          <p>Notifications push navigateur.</p>
        </div>
        <label className="switch" aria-label="Nouveaux messages">
          <input type="checkbox" checked={values.messages} onChange={(event) => onChange({ ...values, messages: event.target.checked })} />
          <span className="slider" />
        </label>
      </div>

      <div className="settings-row">
        <div>
          <h3>Rappels chatbot</h3>
          <p>Conseils ponctuels anti-stress.</p>
        </div>
        <label className="switch" aria-label="Rappels chatbot">
          <input
            type="checkbox"
            checked={values.chatbotReminders}
            onChange={(event) => onChange({ ...values, chatbotReminders: event.target.checked })}
          />
          <span className="slider" />
        </label>
      </div>

      <p className="settings-note">Version 1: ces preferences restent locales et ne sont pas encore synchronisees serveur.</p>
    </section>
  );
}
