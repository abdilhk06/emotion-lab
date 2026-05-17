import { UserAvatar } from "@/components/ui/UserAvatar";

type DashboardGreetingProps = {
  pseudo: string;
  mbtiCode: string | null;
  mbtiName: string | null;
  school: string;
  avatarPath: string | null;
};

export function DashboardGreeting({ pseudo, mbtiCode, mbtiName, school, avatarPath }: DashboardGreetingProps) {
  return (
    <header className="dashboard-greeting">
      <UserAvatar name={pseudo} avatarPath={avatarPath} size={52} className="dashboard-avatar" />
      <p className="dashboard-greeting-label">Bonjour,</p>
      <h2>{pseudo}</h2>
      <div className="dashboard-greeting-line">
        <span className="dashboard-greeting-badge">{mbtiCode ? `${mbtiCode} · ${mbtiName ?? "Profil detecte"}` : "Profil MBTI a completer"}</span>
        <span className="dashboard-greeting-dot">·</span>
        <span className="dashboard-school">{school}</span>
      </div>
      <style jsx>{`
        .dashboard-greeting {
          color: var(--texte);
          display: grid;
          gap: 8px;
        }

        .dashboard-greeting-label {
          margin: 0;
          color: #6b7890;
          font-size: 13px;
        }

        h2 {
          margin: 2px 0 8px;
          font-size: clamp(28px, 4vw, 30px);
          letter-spacing: 0;
        }

        .dashboard-greeting-line {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .dashboard-greeting-badge {
          display: inline-flex;
          border-radius: 999px;
          background: #f7bac1;
          color: var(--plum);
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .dashboard-greeting-dot,
        .dashboard-school {
          color: #263752;
          font-size: 13px;
          font-weight: 500;
        }
      `}</style>
    </header>
  );
}
